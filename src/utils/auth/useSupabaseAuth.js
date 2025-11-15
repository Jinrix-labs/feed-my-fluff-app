import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

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
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
      console.error("Supabase not configured - environment variables missing");
      setLoading(false);
      return;
    }

    // Safely get initial session with error handling
    let subscription = null;
    
    try {
      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            console.error("Error getting Supabase session:", error);
          } else {
            setSession(session);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error getting Supabase session:", error);
          setLoading(false);
        });

      // Listen for auth changes
      const authStateChange = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setLoading(false);
      });
      
      subscription = authStateChange.data.subscription;
    } catch (error) {
      console.error("Error initializing Supabase auth:", error);
      setLoading(false);
    }

    return () => {
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
      await supabase.auth.signOut();
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

