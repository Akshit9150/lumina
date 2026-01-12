export interface VideoResult {
  imageUrl: string;
  videoUrl: string; // Data URL for inline display
  driveLink?: string; // Optional Drive link
  status: "success" | "error";
  error?: string;
}

export interface GenerateVideosRequest {
  imageUrls: string[];
  accessToken: string;
  folderId?: string;
  prompt?: string;
}

export interface GenerateVideosResponse {
  results: VideoResult[];
  totalProcessed: number;
  errors: number;
}

export interface ScrapeImagesRequest {
  collectionUrl: string;
}

export interface ScrapeImagesResponse {
  images: string[];
}

export interface UserUsage {
  attempts: number;
  successes: number;
  attemptLimit: number;
  successLimit: number;
}

export interface UserUsageResponse {
  usage: UserUsage;
}

export interface RecentVideo {
  id: string;
  drive_link: string;
  image_url: string;
  created_at: string;
}

export interface RecentsResponse {
  recents: RecentVideo[];
}

export type AppStep = "input" | "selection" | "generating" | "results";

export interface AppState {
  step: AppStep;
  images: string[];
  selectedImages: string[];
  results: VideoResult[];
  isLoading: boolean;
  error: string | null;
}
