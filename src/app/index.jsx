import { Redirect } from "expo-router";
import { useSupabaseAuth } from "@/utils/auth/useSupabaseAuth";
import { View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "@/utils/theme";
import { useEffect, useState } from "react";
import { getActiveFamilyGroup } from "@/lib/familyGroups";
import Constants from 'expo-constants';

export default function Index() {
  const { session, loading: authLoading } = useSupabaseAuth();
  const [checkingGroup, setCheckingGroup] = useState(false);
  const [hasGroup, setHasGroup] = useState(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  
  // Always call hooks unconditionally
  const theme = useTheme();
  const colors = theme?.colors || {
    background: "#FFFFFF",
    text: "#000000",
    textSecondary: "#666666",
    textMuted: "#999999",
    surface: "#F5F5F5",
    primary: "#744BFF"
  };

  // Check if Supabase is configured
  useEffect(() => {
    const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const configured = !!(supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '');
    setSupabaseConfigured(configured);
  }, []);

  // Check for family group
  useEffect(() => {
    if (session && !authLoading && supabaseConfigured) {
      setCheckingGroup(true);
      getActiveFamilyGroup()
        .then((group) => {
          setHasGroup(!!group);
          setCheckingGroup(false);
        })
        .catch((error) => {
          console.error('❌ [Index] Error checking family group:', error);
          setHasGroup(false);
          setCheckingGroup(false);
        });
    }
  }, [session, authLoading, supabaseConfigured]);

  // NOW we can do conditional returns (after all hooks)
  // Show error if Supabase not configured
  if (!supabaseConfigured) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 24 }}>⚠️</Text>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 16, textAlign: "center" }}>
          Configuration Error
        </Text>
        <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: "center", marginBottom: 24 }}>
          Supabase environment variables are missing.
        </Text>
      </View>
    );
  }

  // Show loading while checking
  if (authLoading || checkingGroup) {
    console.log('🔍 [Index] Showing loading state', { authLoading, checkingGroup });
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Use Redirect component for immediate redirect (more reliable than router.replace)
  if (!session && !authLoading && !checkingGroup) {
    console.log('🔍 [Index] Rendering Redirect to /auth');
    return <Redirect href="/auth" />;
  }

  if (hasGroup === false && !checkingGroup) {
    console.log('🔍 [Index] Rendering Redirect to /family-setup');
    return <Redirect href="/family-setup" />;
  }

  if (hasGroup === true) {
    console.log('🔍 [Index] Rendering Redirect to /(tabs)/today');
    return <Redirect href="/(tabs)/today" />;
  }

  // Default: show loading
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, marginTop: 16 }}>Loading...</Text>
    </View>
  );
}
