import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { scrapeImages } from "@/lib/scraper";

export async function POST(request: NextRequest) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 }
            );
        }

        // Verify the user is authenticated
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { collectionUrl } = body;

        if (!collectionUrl || typeof collectionUrl !== "string") {
            return NextResponse.json(
                { error: "collectionUrl is required" },
                { status: 400 }
            );
        }

        // Validate URL
        try {
            new URL(collectionUrl);
        } catch {
            return NextResponse.json(
                { error: "Invalid URL format" },
                { status: 400 }
            );
        }

        // Scrape images
        const images = await scrapeImages(collectionUrl);

        // Log the scrape attempt
        await supabase.from("scrape_logs").insert({
            user_id: user.id,
            url: collectionUrl,
            image_count: images.length,
        });

        return NextResponse.json({ images });
    } catch (error) {
        console.error("Scrape error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to scrape images";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
