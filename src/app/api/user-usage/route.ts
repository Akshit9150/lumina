import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const DAILY_ATTEMPT_LIMIT = 4;
const DAILY_SUCCESS_LIMIT = 2;

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

        const today = new Date().toISOString().split("T")[0];

        // Get user usage for today
        const { data: usage } = await supabase
            .from("user_usage")
            .select("*")
            .eq("user_id", user.id)
            .single();

        // If no record or record is from previous day, return zeros
        if (!usage || usage.date !== today) {
            return NextResponse.json({
                usage: {
                    attempts: 0,
                    successes: 0,
                    attemptLimit: DAILY_ATTEMPT_LIMIT,
                    successLimit: DAILY_SUCCESS_LIMIT,
                },
            });
        }

        return NextResponse.json({
            usage: {
                attempts: usage.attempts,
                successes: usage.successes,
                attemptLimit: DAILY_ATTEMPT_LIMIT,
                successLimit: DAILY_SUCCESS_LIMIT,
            },
        });
    } catch (error) {
        console.error("User usage error:", error);
        return NextResponse.json(
            { error: "Failed to get usage" },
            { status: 500 }
        );
    }
}
