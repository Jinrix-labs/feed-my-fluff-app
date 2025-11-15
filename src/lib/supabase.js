import { createClient } from "@supabase/supabase-js";
import Constants from 'expo-constants';

// Check both expo-constants (from app.config.js extra) and process.env (from EAS secrets)
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const finalUrl = supabaseUrl || "";
const finalKey = supabaseAnonKey || "";

// Create a safe Supabase client that won't crash if URL/key are empty
// Use placeholder values to prevent createClient from throwing
const safeUrl = finalUrl || "https://placeholder.supabase.co";
const safeKey = finalKey || "placeholder-key";

if (!finalUrl || !finalKey) {
    console.warn(
        "⚠️ Missing Supabase environment variables!\n" +
        "URL:", finalUrl ? "✓" : "✗", "\n" +
    "Key exists:", !!finalKey
    );
}

// Create client - it will fail gracefully if URL/key are invalid
let supabase;
try {
    supabase = createClient(safeUrl, safeKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        }
    });
} catch (error) {
    console.error("Error creating Supabase client:", error);
    // Create a minimal client that won't crash
    supabase = createClient("https://placeholder.supabase.co", "placeholder-key", {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    });
}

// Add a helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
    return !!(finalUrl && finalKey && finalUrl !== "https://placeholder.supabase.co" && finalKey !== "placeholder-key");
};

export { supabase };
export default supabase;