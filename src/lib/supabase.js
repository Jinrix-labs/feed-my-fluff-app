// Completely lazy-loaded Supabase module to avoid blocking
// No static imports - everything is loaded on demand

// Store config - will be set lazily
let supabaseUrl = null;
let supabaseAnonKey = null;
let finalUrl = null;
let finalKey = null;

// Only create client if we have valid credentials
let supabase = null;
let clientInitialized = false;
let initPromise = null;

const getConfig = async () => {
    if (supabaseUrl !== null) {
        return { supabaseUrl, supabaseAnonKey, finalUrl, finalKey };
    }

    // Lazy load config - use dynamic import for expo-constants
    try {
        const Constants = (await import('expo-constants')).default;
        supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
        supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        finalUrl = supabaseUrl || "";
        finalKey = supabaseAnonKey || "";
    } catch (error) {
        console.error("Error loading config:", error);
        finalUrl = "";
        finalKey = "";
    }

    return { supabaseUrl, supabaseAnonKey, finalUrl, finalKey };
};

const initializeClient = async () => {
    if (clientInitialized) return supabase;
    if (initPromise) return await initPromise;

    initPromise = (async () => {
        clientInitialized = true;

        const config = await getConfig();
        const { finalUrl: url, finalKey: key } = config;

        if (!url || !key) {
            console.warn("⚠️ Supabase client will not be initialized. Auth features will be disabled.");
            return null;
        }

        try {
            // Dynamic import of Supabase
            const { createClient } = await import("@supabase/supabase-js");
            supabase = createClient(url, key, {
                db: {
                    schema: 'public'
                },
                global: {
                    headers: {
                        'Prefer': 'return=representation',
                        'Accept-Profile': 'public'
                    }
                },
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false
                }
            });
            console.log("✅ Supabase client initialized successfully");
            return supabase;
        } catch (error) {
            console.error("❌ Error creating Supabase client:", error);
            supabase = null;
            return null;
        }
    })();

    return await initPromise;
};

// Add a helper to check if Supabase is properly configured
export const isSupabaseConfigured = async () => {
    const config = await getConfig();
    return !!(config.finalUrl && config.finalKey &&
        config.finalUrl !== "https://placeholder.supabase.co" &&
        config.finalKey !== "placeholder-key");
};

// Export getter function that initializes client if needed
export const getSupabase = async () => {
    if (!clientInitialized) {
        return await initializeClient();
    }
    return supabase;
};

// For backward compatibility, export supabase (will be null until initialized)
// Initialize on native immediately, but not on web
if (typeof window === 'undefined') {
    // On native, initialize in background (don't await)
    initializeClient().catch(err => console.error("Failed to init Supabase:", err));
}

export { supabase };
export default supabase;
