import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateVideo } from "@/lib/veo-client";
import { uploadToDrive } from "@/lib/drive-client";
import { VideoResult } from "@/types";

const DAILY_ATTEMPT_LIMIT = 4;
const DAILY_SUCCESS_LIMIT = 2;
const GLOBAL_BETA_LIMIT = 50;

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { imageUrls, accessToken, folderId, prompt } = body;

        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            return NextResponse.json(
                { error: "imageUrls array is required" },
                { status: 400 }
            );
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: "Google access token is required" },
                { status: 400 }
            );
        }

        // Check global beta limit
        const today = new Date().toISOString().split("T")[0];
        const { count: globalCount } = await supabase
            .from("video_logs")
            .select("*", { count: "exact", head: true })
            .eq("status", 1);

        if (globalCount && globalCount >= GLOBAL_BETA_LIMIT) {
            return NextResponse.json(
                { error: "Global beta limit reached. Please try again later." },
                { status: 429 }
            );
        }

        // Get or create user usage record for today
        let { data: usage } = await supabase
            .from("user_usage")
            .select("*")
            .eq("user_id", user.id)
            .single();

        // Check if usage record is from a previous day
        if (usage && usage.date !== today) {
            // Reset for new day
            await supabase
                .from("user_usage")
                .update({ date: today, attempts: 0, successes: 0, updated_at: new Date().toISOString() })
                .eq("user_id", user.id);
            usage = { ...usage, date: today, attempts: 0, successes: 0 };
        }

        if (!usage) {
            // Create new usage record
            const { data: newUsage } = await supabase
                .from("user_usage")
                .insert({ user_id: user.id, date: today, attempts: 0, successes: 0 })
                .select()
                .single();
            usage = newUsage;
        }

        // Check limits
        if (usage && usage.attempts >= DAILY_ATTEMPT_LIMIT) {
            return NextResponse.json(
                { error: "Daily attempt limit reached. Please try again tomorrow." },
                { status: 429 }
            );
        }

        if (usage && usage.successes >= DAILY_SUCCESS_LIMIT) {
            return NextResponse.json(
                { error: "Daily success limit reached. Please try again tomorrow." },
                { status: 429 }
            );
        }

        // Increment attempt count
        await supabase
            .from("user_usage")
            .update({
                attempts: (usage?.attempts || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);

        // Process images
        const results: VideoResult[] = [];

        for (const imageUrl of imageUrls) {
            try {
                // Generate video
                const videoDataUrl = await generateVideo({
                    imageUrl,
                    prompt,
                });

                // Upload to Google Drive
                const { driveLink } = await uploadToDrive({
                    videoData: videoDataUrl,
                    accessToken,
                    folderId,
                });

                // Log success
                await supabase.from("video_logs").insert({
                    user_id: user.id,
                    image_url: imageUrl.substring(0, 500), // Truncate for storage
                    drive_link: driveLink,
                    status: 1,
                });

                // Increment success count
                await supabase
                    .from("user_usage")
                    .update({
                        successes: (usage?.successes || 0) + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq("user_id", user.id);

                results.push({
                    imageUrl,
                    videoUrl: videoDataUrl,
                    driveLink,
                    status: "success",
                });
            } catch (error) {
                console.error("Error processing image:", error);

                // Log failure
                await supabase.from("video_logs").insert({
                    user_id: user.id,
                    image_url: imageUrl.substring(0, 500),
                    status: 0,
                });

                results.push({
                    imageUrl,
                    videoUrl: "",
                    status: "error",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            results,
            totalProcessed: results.length,
            errors: results.filter((r) => r.status === "error").length,
        });
    } catch (error) {
        console.error("Generate videos error:", error);
        return NextResponse.json(
            { error: "Failed to generate videos" },
            { status: 500 }
        );
    }
}
