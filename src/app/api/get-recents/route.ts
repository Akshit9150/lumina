import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get last 5 successful video generations
        const { data: recents, error } = await supabase
            .from("video_logs")
            .select("id, drive_link, image_url, created_at")
            .eq("user_id", user.id)
            .eq("status", 1)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            recents: recents || [],
        });
    } catch (error) {
        console.error("Get recents error:", error);
        return NextResponse.json(
            { error: "Failed to get recent videos" },
            { status: 500 }
        );
    }
}
