"use client";

interface GeneratingProps {
    progress: string;
    currentImage?: number;
    totalImages?: number;
}

export default function Generating({
    progress,
    currentImage = 1,
    totalImages = 1,
}: GeneratingProps) {
    return (
        <div className="py-16 px-4 animate-fade-in">
            <div className="max-w-md mx-auto text-center">
                {/* Animated loader */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                    {/* Spinning gradient ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" />
                    {/* Center content */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 flex items-center justify-center">
                        <span className="text-4xl animate-pulse">✨</span>
                    </div>
                </div>

                {/* Progress text */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Generating Video{totalImages > 1 ? "s" : ""}...
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {progress}
                </p>

                {totalImages > 1 && (
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-xs">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${(currentImage / totalImages) * 100}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {currentImage} / {totalImages}
                        </span>
                    </div>
                )}

                <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
                    This may take 1-2 minutes. Please don&apos;t close this tab.
                </p>
            </div>
        </div>
    );
}
