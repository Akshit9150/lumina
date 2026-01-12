"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { VideoResult, RecentVideo, UserUsage, AppStep } from "@/types";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ImageGrid from "@/components/ImageGrid";
import Generating from "@/components/Generating";
import VideoResultCard from "@/components/VideoResult";
import RecentGenerations from "@/components/RecentGenerations";
import DriveFolderPicker from "@/components/DriveFolderPicker";
import Footer from "@/components/Footer";

export default function Home() {
  const supabase = createClient();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // App state
  const [step, setStep] = useState<AppStep>("input");
  const [images, setImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [recents, setRecents] = useState<RecentVideo[]>([]);
  const [usage, setUsage] = useState<UserUsage | null>(null);

  // Loading states
  const [isScraping, setIsScraping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState("");
  const [loadingRecents, setLoadingRecents] = useState(false);

  // Drive folder picker
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<{
    id: string | null;
    name: string | null;
  }>({ id: null, name: null });

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Pending URL for auto-resume after auth
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Initialize auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch recents and usage when user changes
  useEffect(() => {
    if (user) {
      fetchRecents();
      fetchUsage();
    }
  }, [user]);

  // Check for pending URL on mount
  useEffect(() => {
    const stored = localStorage.getItem("pendingUrl");
    if (stored && user) {
      localStorage.removeItem("pendingUrl");
      handleScrapeUrl(stored);
    }
  }, [user]);

  const fetchRecents = async () => {
    if (!session?.access_token) return;
    setLoadingRecents(true);
    try {
      const res = await fetch("/api/get-recents", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecents(data.recents || []);
      }
    } catch (err) {
      console.error("Failed to fetch recents:", err);
    } finally {
      setLoadingRecents(false);
    }
  };

  const fetchUsage = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/user-usage", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    }
  };

  const handleScrapeUrl = async (url: string) => {
    if (!user) {
      // Save URL and redirect to sign in
      localStorage.setItem("pendingUrl", url);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          scopes: "https://www.googleapis.com/auth/drive.file",
        },
      });
      return;
    }

    setError(null);
    setIsScraping(true);
    setImages([]);
    setSelectedImages([]);

    try {
      const res = await fetch("/api/scrape-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ collectionUrl: url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to scrape images");
      }

      const data = await res.json();
      if (data.images && data.images.length > 0) {
        setImages(data.images);
        setStep("selection");
      } else {
        setError("No images found at that URL. Try a different product page.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape images");
    } finally {
      setIsScraping(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!user) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          scopes: "https://www.googleapis.com/auth/drive.file",
        },
      });
      return;
    }

    setError(null);
    const imageUrls: string[] = [];

    for (const file of files) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      imageUrls.push(dataUrl);
    }

    setImages(imageUrls);
    setSelectedImages([]);
    setStep("selection");
  };

  const handleToggleSelect = (imageUrl: string) => {
    setSelectedImages((prev) =>
      prev.includes(imageUrl)
        ? prev.filter((url) => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const handleSelectAll = () => {
    setSelectedImages([...images]);
  };

  const handleDeselectAll = () => {
    setSelectedImages([]);
  };

  const handleFolderSelect = (
    folderId: string | null,
    folderName: string | null
  ) => {
    setSelectedFolder({ id: folderId, name: folderName });
  };

  const handleGenerate = async () => {
    if (!user || selectedImages.length === 0) return;

    // Check if we have Google access token
    const providerToken = session?.provider_token;
    if (!providerToken) {
      setError("Google access token expired. Please sign in again.");
      return;
    }

    // Check usage limits
    if (usage) {
      if (usage.attempts >= usage.attemptLimit) {
        setError("Daily attempt limit reached. Please try again tomorrow.");
        return;
      }
      if (usage.successes >= usage.successLimit) {
        setError("Daily success limit reached. Please try again tomorrow.");
        return;
      }
    }

    setError(null);
    setIsGenerating(true);
    setStep("generating");
    setGeneratingProgress("Preparing your images...");
    setResults([]);

    try {
      setGeneratingProgress("Generating video with AI...");

      const res = await fetch("/api/generate-videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          imageUrls: selectedImages,
          accessToken: providerToken,
          folderId: selectedFolder.id,
          prompt: undefined, // Use default prompt
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate videos");
      }

      const data = await res.json();
      setResults(data.results || []);
      setStep("results");

      // Refresh usage and recents
      fetchUsage();
      fetchRecents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate videos");
      setStep("selection");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setStep("input");
    setImages([]);
    setSelectedImages([]);
    setResults([]);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="flex-1">
        {/* Error banner */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
              <span className="text-red-500">⚠️</span>
              <p className="text-red-700 dark:text-red-300 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Usage warning */}
        {usage && user && (
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>📊</span>
                <span className="text-purple-700 dark:text-purple-300 text-sm">
                  Today: {usage.attempts}/{usage.attemptLimit} attempts,{" "}
                  {usage.successes}/{usage.successLimit} videos generated
                </span>
              </div>
              {selectedFolder.name && (
                <span className="text-purple-600 dark:text-purple-400 text-sm flex items-center gap-1">
                  📁 {selectedFolder.name}
                  <button
                    onClick={() => setShowFolderPicker(true)}
                    className="underline hover:no-underline ml-2"
                  >
                    Change
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step: Input */}
        {step === "input" && (
          <HeroSection
            onUrlSubmit={handleScrapeUrl}
            onFileUpload={handleFileUpload}
            isLoading={isScraping}
          />
        )}

        {/* Step: Selection */}
        {step === "selection" && (
          <>
            <ImageGrid
              images={images}
              selectedImages={selectedImages}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />

            {/* Action bar */}
            <div className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 py-4 px-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <button
                  onClick={handleStartOver}
                  className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  ← Back
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFolderPicker(true)}
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    📁 {selectedFolder.name || "Choose Folder"}
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={selectedImages.length === 0}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <span>✨</span>
                    Generate {selectedImages.length > 0 ? `(${selectedImages.length})` : ""}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <Generating
            progress={generatingProgress}
            currentImage={1}
            totalImages={selectedImages.length}
          />
        )}

        {/* Step: Results */}
        {step === "results" && (
          <div className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Videos Are Ready! 🎉
                </h2>
                <button
                  onClick={handleStartOver}
                  className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Create More
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result, index) => (
                  <VideoResultCard key={index} result={result} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent generations */}
        {step === "input" && (
          <RecentGenerations recents={recents} isLoading={loadingRecents} />
        )}
      </main>

      <Footer />

      {/* Drive folder picker modal */}
      {showFolderPicker && session?.provider_token && (
        <DriveFolderPicker
          accessToken={session.provider_token}
          onFolderSelect={handleFolderSelect}
          onClose={() => setShowFolderPicker(false)}
        />
      )}
    </div>
  );
}
