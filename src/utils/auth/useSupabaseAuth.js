import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { getSupabase } from '@/lib/supabase';

/**
 * Hook for Supabase authentication
 * Handles auth state (navigation is handled in index.jsx and family-setup)
 */
export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured - check both sources
    const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔍 [useSupabaseAuth] Config check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlFromConstants: !!Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL,
      urlFromEnv: !!process.env.EXPO_PUBLIC_SUPABASE_URL
    });
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
      console.error("⚠️ [useSupabaseAuth] Supabase not configured - environment variables missing");
      setLoading(false);
      return;
    }
    
    console.log('🔍 [useSupabaseAuth] Supabase configured, initializing auth...');

    // Set initial state - we'll update when we get the actual session
    setLoading(true);
    setSession(null);
    
    let subscription = null;
    let setupTimeout = null;
    
    // Get Supabase client asynchronously (non-blocking)
    getSupabase().then(supabaseClient => {
      if (!supabaseClient) {
        console.warn("⚠️ [useSupabaseAuth] Supabase client not initialized - skipping auth check");
        setLoading(false);
        return;
      }
      
      // Check for existing session first
      supabaseClient.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error("❌ [useSupabaseAuth] Error getting session:", error);
        } else {
          console.log("🔍 [useSupabaseAuth] Initial session check:", data.session ? "Has session" : "No session");
          setSession(data.session);
        }
        setLoading(false);
      }).catch(err => {
        console.error("❌ [useSupabaseAuth] Error in getSession:", err);
        setLoading(false);
      });
      
      // Set up auth listener for future changes
      try {
        console.log("🔍 [useSupabaseAuth] Setting up auth state listener...");
        
        const authStateChange = supabaseClient.auth.onAuthStateChange((_event, session) => {
          console.log("🔄 [useSupabaseAuth] Auth state changed:", _event, session ? "Authenticated" : "Not authenticated");
          setSession(session);
          setLoading(false); // Ensure loading is false after any state change
        });
        
        subscription = authStateChange.data.subscription;
        console.log("✅ [useSupabaseAuth] Auth state listener set up successfully");
      } catch (error) {
        console.error("❌ [useSupabaseAuth] Error setting up auth listener:", error);
        setLoading(false);
      }
    }).catch(err => {
      console.error("❌ [useSupabaseAuth] Error getting Supabase client:", err);
      setLoading(false);
    });

    return () => {
      if (setupTimeout) clearTimeout(setupTimeout);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from auth:", error);
        }
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const supabase = await getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
    isAuthenticated: !!session,
  };
}
