import { Redirect } from "expo-router";
import { useSupabaseAuth } from "@/utils/auth/useSupabaseAuth";
import { View, ActivityIndicator, Text, ScrollView } from "react-native";
import { useTheme } from "@/utils/theme";
import { useEffect, useState } from "react";
import { getActiveFamilyGroup } from "@/lib/familyGroups";
import Constants from 'expo-constants';
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Index() {
  const { session, loading: authLoading } = useSupabaseAuth();
  const { colors } = useTheme();
  const [checkingGroup, setCheckingGroup] = useState(false);
  const [hasGroup, setHasGroup] = useState(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Check if Supabase is configured
  useEffect(() => {
    // Check both expo-constants and process.env
    const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const configured = !!(supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '');
    setSupabaseConfigured(configured);
  }, []);

  useEffect(() => {
    if (session && !authLoading && supabaseConfigured) {
      setCheckingGroup(true);
      getActiveFamilyGroup()
        .then((group) => {
          setHasGroup(!!group);
          setCheckingGroup(false);
        })
        .catch(() => {
          setHasGroup(false);
          setCheckingGroup(false);
        });
    }
  }, [session, authLoading, supabaseConfigured]);

  // Show error if Supabase not configured
  if (!supabaseConfigured) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <ScrollView contentContainerStyle={{ alignItems: "center" }}>
          <Text style={{ fontSize: 48, marginBottom: 24 }}>⚠️</Text>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 16, textAlign: "center" }}>
            Configuration Error
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 24 }}>
            Supabase environment variables are missing.
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 }}>
            For EAS builds, set secrets using:{'\n\n'}
            <Text style={{ fontFamily: "monospace", backgroundColor: colors.surface, padding: 8, borderRadius: 4 }}>
              eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your-url{'\n'}
              eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-key
            </Text>
          </Text>
        </ScrollView>
      </View>
    );
  }

  if (authLoading || checkingGroup) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  // Check if user has a family group
  if (hasGroup === false) {
    return <Redirect href="/family-setup" />;
  }

  // User is authenticated and has a group
  return <Redirect href="/(tabs)/today" />;
}
