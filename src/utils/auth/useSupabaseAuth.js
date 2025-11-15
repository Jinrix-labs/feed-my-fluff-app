import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook for Supabase authentication
 * Handles auth state (navigation is handled in index.jsx and family-setup)
 */
export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase not configured - environment variables missing");
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error getting Supabase session:", error);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
    isAuthenticated: !!session,
  };
}

