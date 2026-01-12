"use client";

import { VideoResult as VideoResultType } from "@/types";

interface VideoResultProps {
    result: VideoResultType;
}

export default function VideoResult({ result }: VideoResultProps) {
    const handleDownload = async () => {
        if (!result.videoUrl) return;

        // Convert data URL to blob for download
        const response = await fetch(result.videoUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `lumina-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (result.status === "error") {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 animate-fade-in">
                <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                            src={result.imageUrl}
                            alt="Source"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-medium text-red-700 dark:text-red-400 mb-1">
                            Generation Failed
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-300">
                            {result.error || "An error occurred during video generation."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden animate-fade-in-scale">
            {/* Video preview */}
            <div className="relative aspect-[9/16] max-h-[400px] bg-black">
                <video
                    src={result.videoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3">
                {/* Source image thumbnail */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                            src={result.imageUrl}
                            alt="Source"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Video Generated ✨
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            From source image
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Download
                    </button>

                    {result.driveLink && (
                        <a
                            href={result.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5-3.42-6zm9.58 0l-6.56 11.5 3.42 6L20.85 9l-3.56-5.5zm-9.58 0L14.27 15l6.56-11.5h-6.56l-6.56 0z" />
                            </svg>
                            View in Drive
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
