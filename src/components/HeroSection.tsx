"use client";

import { useState, useRef, ChangeEvent } from "react";

interface HeroSectionProps {
    onUrlSubmit: (url: string) => void;
    onFileUpload: (files: File[]) => void;
    isLoading: boolean;
}

export default function HeroSection({
    onUrlSubmit,
    onFileUpload,
    isLoading,
}: HeroSectionProps) {
    const [activeTab, setActiveTab] = useState<"url" | "upload">("url");
    const [url, setUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlSubmit(url.trim());
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onFileUpload(files);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter((file) =>
            file.type.startsWith("image/")
        );
        if (files.length > 0) {
            onFileUpload(files);
        }
    };

    return (
        <section className="py-16 px-4 animate-fade-in">
            <div className="max-w-4xl mx-auto text-center">
                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                        Transform Images
                    </span>
                    <br />
                    <span className="text-gray-900 dark:text-white">
                        Into Stunning Videos
                    </span>
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
                    Powered by Google&apos;s Veo AI. Scrape product images from any URL or
                    upload your own, then generate professional showcase videos in seconds.
                </p>

                {/* Tab buttons */}
                <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-8">
                    <button
                        onClick={() => setActiveTab("url")}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "url"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                    >
                        🔗 Scrape URL
                    </button>
                    <button
                        onClick={() => setActiveTab("upload")}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "upload"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                    >
                        📤 Upload Files
                    </button>
                    <button
                        disabled
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    >
                        🎬 Multi-Image (Soon)
                    </button>
                </div>

                {/* URL Input */}
                {activeTab === "url" && (
                    <form onSubmit={handleUrlSubmit} className="animate-fade-in-scale">
                        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste any product collection URL..."
                                className="flex-1 px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !url.trim()}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin">✨</span>
                                        Scraping...
                                    </>
                                ) : (
                                    <>
                                        <span>🔍</span>
                                        Scrape Images
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* File Upload */}
                {activeTab === "upload" && (
                    <div className="animate-fade-in-scale">
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="max-w-2xl mx-auto p-12 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all"
                        >
                            <div className="text-center">
                                <div className="text-5xl mb-4">📷</div>
                                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Drop images here or click to upload
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Supports JPG, PNG, WebP
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
