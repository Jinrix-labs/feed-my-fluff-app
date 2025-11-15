import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Use fallback values in development if not set (prevents crash)
// In production, these MUST be set via EAS secrets
const finalUrl = supabaseUrl || "";
const finalKey = supabaseAnonKey || "";

if (!finalUrl || !finalKey) {
    console.error(
        "⚠️ Missing Supabase environment variables!\n" +
        "Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY\n" +
        "For EAS builds, use: eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your-url\n" +
        "For local builds, add them to your .env file"
    );
}

// Create client even if values are empty (will fail gracefully on API calls)
export const supabase = createClient(finalUrl, finalKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
});

export default supabase;