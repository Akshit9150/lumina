import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a mock client for development without Supabase configured
        console.warn(
            "Supabase credentials not configured. Some features will be unavailable."
        );
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
                signInWithOAuth: async () => {
                    alert("Please configure Supabase credentials to enable authentication.");
                    return { data: { url: null, provider: null }, error: null };
                },
                signOut: async () => ({ error: null }),
                onAuthStateChange: () => ({
                    data: { subscription: { unsubscribe: () => { } } },
                }),
            },
            from: () => ({
                select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
                insert: async () => ({ data: null, error: null }),
                update: () => ({ eq: async () => ({ data: null, error: null }) }),
            }),
        } as ReturnType<typeof createBrowserClient>;
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
