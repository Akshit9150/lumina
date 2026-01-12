import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Video generation will fail.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "" });

const DEFAULT_PROMPT = `Create a professional product showcase video. 
The camera should slowly orbit around the product with smooth, cinematic movements. 
Add subtle lighting effects that highlight the product's features. 
The background should be clean and minimalist. 
Make it feel premium and high-end, like a luxury advertisement.`;

interface GenerateVideoOptions {
    imageUrl: string;
    prompt?: string;
}

export async function generateVideo(
    options: GenerateVideoOptions
): Promise<string> {
    const { imageUrl, prompt = DEFAULT_PROMPT } = options;

    try {
        // Prepare image data
        let mimeType: string;
        let imageBytes: string;

        if (imageUrl.startsWith("data:")) {
            // Extract base64 data from data URL
            const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                throw new Error("Invalid data URL format");
            }
            [, mimeType, imageBytes] = matches;
        } else {
            // For remote URLs, we need to fetch and convert to base64
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            imageBytes = Buffer.from(arrayBuffer).toString("base64");
            mimeType = response.headers.get("content-type") || "image/jpeg";
        }

        console.log("Starting video generation with Veo...");

        // Generate video using Veo 3.1 - using the correct format from docs
        let operation = await ai.models.generateVideos({
            model: "veo-3.1-generate-preview",
            prompt: prompt,
            image: {
                imageBytes: imageBytes,
                mimeType: mimeType,
            },
        });

        console.log("Video generation started, polling for completion...");

        // Poll the operation status until the video is ready
        while (!operation.done) {
            console.log("Waiting for video generation to complete...");
            await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds
            operation = await ai.operations.getVideosOperation({
                operation: operation,
            });
        }

        console.log("Video generation complete!");

        // Check for errors
        if (operation.error) {
            throw new Error(typeof operation.error.message === "string" ? operation.error.message : "Video generation failed");
        }

        // Extract the video from the result
        if (operation.response?.generatedVideos?.[0]?.video) {
            const video = operation.response.generatedVideos[0].video;

            // Get the video bytes - prefer direct bytes if available
            if (video.videoBytes) {
                return `data:video/mp4;base64,${video.videoBytes}`;
            } else {
                // Use the SDK's files.download method which handles authentication
                // Download to a temp file, then read it
                const tempDir = os.tmpdir();
                const tempFilePath = path.join(tempDir, `veo_video_${Date.now()}.mp4`);

                try {
                    await ai.files.download({
                        file: video,
                        downloadPath: tempFilePath,
                    });

                    // Read the downloaded file
                    const videoBuffer = fs.readFileSync(tempFilePath);
                    const base64Video = videoBuffer.toString("base64");

                    // Clean up temp file
                    fs.unlinkSync(tempFilePath);

                    return `data:video/mp4;base64,${base64Video}`;
                } catch (downloadError) {
                    // Clean up temp file if it exists
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                    throw new Error(`Failed to download video: ${downloadError instanceof Error ? downloadError.message : "Unknown error"}`);
                }
            }
        }

        throw new Error("Video generation failed - no video returned");
    } catch (error) {
        console.error("Veo generation error:", error);
        throw error;
    }
}
