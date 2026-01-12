"use client";

import { RecentVideo } from "@/types";

interface RecentGenerationsProps {
    recents: RecentVideo[];
    isLoading?: boolean;
}

export default function RecentGenerations({
    recents,
    isLoading = false,
}: RecentGenerationsProps) {
    if (isLoading) {
        return (
            <div className="py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Recent Generations
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-xl bg-gray-200 dark:bg-gray-700 animate-shimmer"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (recents.length === 0) {
        return null;
    }

    return (
        <div className="py-8 px-4 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Recent Generations
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {recents.map((video) => (
                        <a
                            key={video.id}
                            href={video.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
                        >
                            <img
                                src={video.image_url}
                                alt="Video thumbnail"
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                        <svg
                                            className="w-5 h-5 text-gray-900 ml-1"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            {/* Date badge */}
                            <div className="absolute bottom-2 left-2 right-2">
                                <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg truncate">
                                    {new Date(video.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
