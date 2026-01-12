"use client";

interface ImageGridProps {
    images: string[];
    selectedImages: string[];
    onToggleSelect: (imageUrl: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    isLoading?: boolean;
}

export default function ImageGrid({
    images,
    selectedImages,
    onToggleSelect,
    onSelectAll,
    onDeselectAll,
    isLoading = false,
}: ImageGridProps) {
    if (isLoading) {
        return (
            <div className="py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
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

    if (images.length === 0) {
        return null;
    }

    return (
        <div className="py-8 px-4 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                {/* Header with selection controls */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Select Images ({selectedImages.length} / {images.length})
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={onSelectAll}
                            className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                            Select All
                        </button>
                        <button
                            onClick={onDeselectAll}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Image grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((imageUrl, index) => {
                        const isSelected = selectedImages.includes(imageUrl);
                        return (
                            <div
                                key={`${imageUrl}-${index}`}
                                onClick={() => onToggleSelect(imageUrl)}
                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all ${isSelected
                                        ? "ring-4 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900"
                                        : "hover:scale-[1.02]"
                                    }`}
                            >
                                <img
                                    src={imageUrl}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />

                                {/* Selection overlay */}
                                <div
                                    className={`absolute inset-0 transition-all ${isSelected
                                            ? "bg-purple-500/20"
                                            : "bg-black/0 group-hover:bg-black/10"
                                        }`}
                                />

                                {/* Checkbox */}
                                <div
                                    className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                            ? "bg-purple-500 border-purple-500"
                                            : "bg-white/80 border-gray-300 group-hover:border-purple-400"
                                        }`}
                                >
                                    {isSelected && (
                                        <svg
                                            className="w-4 h-4 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
