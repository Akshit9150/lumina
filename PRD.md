# Product Requirements Document: Lumina – Photo to Video AI

## 🎯 Vision Statement

Build **Lumina**, a web application that transforms static product images into captivating AI-generated videos. Users can either scrape images from any e-commerce URL or upload their own images, then use Google's Veo 3.1 AI to generate professional product showcase videos that are automatically saved to their Google Drive.

---

## 🕐 Workshop Duration: 2 Hours

This document is designed for participants to recreate this application during a hands-on workshop using an AI coding assistant. Focus on getting core functionality working first, then enhance with premium UI/UX.

---

## 📋 Table of Contents

1. [Core Features](#core-features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [UI/UX Requirements](#uiux-requirements)
7. [Environment Variables](#environment-variables)
8. [Implementation Phases](#implementation-phases)
9. [External Service Setup](#external-service-setup)

---

## Core Features

### 1. User Authentication (Google OAuth via Supabase)
- Sign in with Google
- Session persistence
- Access token management for Google Drive API
- Request additional OAuth scope: `https://www.googleapis.com/auth/drive.file`

### 2. Image Input Methods
- **URL Scraping**: Paste any product collection URL → scrape and display product images
- **File Upload**: Upload images directly from device (JPG, PNG, WebP)
- **Coming Soon** placeholders for Multi-Image and Extend features

### 3. AI Video Generation
- Select one or more images from scraped/uploaded collection
- Customize video generation prompt (optional)
- Generate 8-second product showcase videos using Google Veo 3.1 API
- Real-time progress tracking with status messages

### 4. Google Drive Integration
- Authenticate with user's Google account
- Allow folder selection via Google Drive Picker
- Auto-upload generated videos to selected folder (or root)
- Return shareable Drive links

### 5. Usage Limits & Tracking
- Daily attempt limit: 4 attempts per user
- Daily success limit: 2 successful videos per user
- Global beta limit: 50 total videos
- Reset limits daily

### 6. Recent Generations
- Display last 5 generated videos on homepage
- Quick access via thumbnail links to Google Drive

### 7. Dark Mode
- Toggle between light and dark themes
- Persist preference in localStorage
- Respect system preference on first visit

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Authentication** | Supabase Auth (Google OAuth) |
| **Database** | Supabase (PostgreSQL) |
| **AI Video Generation** | Google Gemini Veo 3.1 API (`@google/genai`) |
| **Web Scraping** | Playwright (local dev) / Browserless (production) |
| **Cloud Storage** | Google Drive API (`googleapis`) |
| **UI Component** | react-google-drive-picker |
| **Analytics** | Vercel Analytics & Speed Insights |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Home Page (page.tsx)                                        │ │
│  │  - Input Step: URL or Upload                                 │ │
│  │  - Selection Step: Choose images                             │ │
│  │  - Generating Step: Progress indicator                       │ │
│  │  - Results Step: Video playback & download                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Components                                                   │ │
│  │  - DriveFolderPicker                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Routes                               │
│  /api/scrape-images    → Extract images from URL                 │
│  /api/generate-videos  → Create videos & upload to Drive         │
│  /api/user-usage       → Check daily usage limits                │
│  /api/get-recents      → Fetch recent video generations          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Library Functions                           │
│  lib/scraper.ts      → Playwright/Browserless scraping           │
│  lib/veo-client.ts   → Google Veo 3.1 video generation           │
│  lib/drive-client.ts → Google Drive upload                       │
│  lib/supabase.ts     → Supabase client                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       External Services                          │
│  - Supabase (Auth + Database)                                    │
│  - Google Gemini Veo 3.1 API                                     │
│  - Google Drive API                                              │
│  - Browserless (production scraping)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Table: `user_usage`
Tracks daily usage limits per user.

```sql
CREATE TABLE user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    attempts INTEGER DEFAULT 0,
    successes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
```

### Table: `video_logs`
Logs all video generation attempts.

```sql
CREATE TABLE video_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    drive_file_id TEXT,
    drive_link TEXT,
    image_url TEXT NOT NULL,
    status INTEGER DEFAULT 0, -- 0 = failure, 1 = success
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `scrape_logs`
Logs all scraping attempts.

```sql
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    url TEXT NOT NULL,
    image_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### `POST /api/scrape-images`
**Purpose**: Scrape product images from a URL

**Headers**:
- `Authorization: Bearer <supabase_access_token>`

**Request Body**:
```json
{
  "collectionUrl": "https://example.com/products"
}
```

**Response**:
```json
{
  "images": ["https://...", "https://..."]
}
```

---

### `POST /api/generate-videos`
**Purpose**: Generate videos from selected images

**Headers**:
- `Authorization: Bearer <supabase_access_token>`

**Request Body**:
```json
{
  "imageUrls": ["https://...", "data:image/..."],
  "accessToken": "<google_oauth_token>",
  "folderId": "<google_drive_folder_id>",
  "prompt": "Custom video generation prompt"
}
```

**Response**:
```json
{
  "results": [
    {
      "imageUrl": "...",
      "videoUrl": "data:video/mp4;base64,...",
      "driveLink": "https://drive.google.com/...",
      "status": "success"
    }
  ],
  "totalProcessed": 1,
  "errors": 0
}
```

---

### `GET /api/user-usage`
**Purpose**: Check user's daily usage limits

**Response**:
```json
{
  "usage": {
    "attempts": 2,
    "successes": 1,
    "attemptLimit": 4,
    "successLimit": 2
  }
}
```

---

### `GET /api/get-recents`
**Purpose**: Fetch user's recent video generations

**Response**:
```json
{
  "recents": [
    {
      "id": "...",
      "drive_link": "https://drive.google.com/...",
      "image_url": "https://..."
    }
  ]
}
```

---

## UI/UX Requirements

### Design System

```css
/* Light Mode Colors */
--background: #fafafa
--foreground: #171717
--accent: #7c3aed (Purple-600)
--accent-light: #a78bfa (Purple-400)

/* Dark Mode Colors */
--background: #0a0a0b
--foreground: #fafafa
--accent: #a78bfa
--accent-light: #c4b5fd
```

### Key UI Components

1. **Navbar**: Sticky, glassmorphism effect, logo + auth button + dark mode toggle
2. **Hero Section**: Large headline with gradient text, input tabs
3. **Image Grid**: 4-column responsive grid with selection overlays
4. **Loading States**: Skeleton animations, spinning loader with sparkle emoji
5. **Result Cards**: Video preview, download button, Drive link
6. **Modals**: Drive folder picker with backdrop blur
7. **Footer**: Credits and legal links

### Animations

- `fade-in`: translateY + opacity transition
- `fade-in-scale`: scale + opacity transition
- `shimmer`: Background gradient animation for skeletons
- Hover effects on all interactive elements

### Mobile Responsiveness
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Responsive grid columns
- Collapsible tabs on mobile

---

## Environment Variables

Create a `.env.local` file with these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Google Gemini (Veo 3.1)
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth (for Drive)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=your_picker_api_key

# Browserless (production scraping)
BROWSERLESS_API_KEY=your_browserless_api_key  # Optional for local dev
```

---

## Implementation Phases

### Phase 1: Project Setup (15 mins)
1. Initialize Next.js 16 project with TypeScript and Tailwind CSS v4
2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js @google/genai googleapis react-google-drive-picker playwright-core @vercel/analytics @vercel/speed-insights
   npm install -D playwright
   ```
3. Set up folder structure (`lib/`, `components/`, `types/`)
4. Configure environment variables

### Phase 2: Authentication (20 mins)
1. Set up Supabase client (`lib/supabase.ts`)
2. Configure Google OAuth in Supabase dashboard
3. Implement sign-in/sign-out in main page
4. Add auth state listener with pending URL auto-resume

### Phase 3: Image Scraping (25 mins)
1. Create scraper library (`lib/scraper.ts`)
   - Local: Use Playwright
   - Production: Use Browserless API
2. Build `/api/scrape-images` route
3. Implement image selection UI with checkbox overlay

### Phase 4: Video Generation (30 mins)
1. Create Veo client (`lib/veo-client.ts`)
   - Convert image URL/base64 to proper format
   - Submit to Gemini Veo 3.1 API
   - Poll for completion
   - Return video as data URL
2. Create Drive client (`lib/drive-client.ts`)
   - Upload video buffer to Google Drive
   - Return shareable link
3. Build `/api/generate-videos` route with usage limits

### Phase 5: UI Polish (20 mins)
1. Implement dark mode toggle with localStorage
2. Add loading skeletons and animations
3. Build results grid with video previews
4. Add Drive folder picker modal

### Phase 6: Final Touches (10 mins)
1. Add recent generations section
2. Implement usage limit warnings
3. Add privacy/terms pages
4. Test complete flow

---

## External Service Setup

### Supabase Setup
1. Create new Supabase project
2. Enable Google OAuth provider
3. Add redirect URL: `http://localhost:3000` (and production URL)
4. Create database tables using schema above
5. Set up Row Level Security (RLS) policies

### Google Cloud Setup
1. Create Google Cloud project
2. Enable APIs:
   - Google Drive API
   - Google Picker API
   - Generative Language API (for Gemini)
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized origins and redirect URIs
5. Create API key for Picker
6. Get Gemini API key from [AI Studio](https://aistudio.google.com)

### Browserless (Optional for Production)
1. Sign up at [browserless.io](https://browserless.io)
2. Get API key for scraping with residential proxy

---

## TypeScript Types

```typescript
// types/index.ts

export interface VideoResult {
  imageUrl: string
  videoUrl: string      // Data URL for inline display
  driveLink?: string    // Optional Drive link
  status: 'success' | 'error'
  error?: string
}

export interface GenerateVideosRequest {
  collectionUrl: string
}

export interface GenerateVideosResponse {
  results: VideoResult[]
  totalProcessed: number
  errors: number
}
```

---

## Success Criteria

By the end of the workshop, participants should have a working app that can:

- [ ] Sign in with Google
- [ ] Scrape images from any product URL
- [ ] Upload images directly
- [ ] Select images for video generation
- [ ] Generate AI videos using Veo 3.1
- [ ] Upload videos to Google Drive
- [ ] Display generated videos inline
- [ ] Toggle dark/light mode
- [ ] Show recent generations
- [ ] Handle errors gracefully

---

## Bonus Challenges (If Time Permits)

1. Add Vercel Analytics integration
2. Implement responsive design polish
3. Add custom prompt editing
4. Implement keyboard shortcuts
5. Add toast notifications for actions

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google AI Studio](https://aistudio.google.com)
- [Google Drive API Docs](https://developers.google.com/drive/api)
- [Browserless Documentation](https://www.browserless.io/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

*Happy building! 🚀*
