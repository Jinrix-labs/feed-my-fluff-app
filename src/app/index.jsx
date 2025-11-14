import { Redirect } from "expo-router";
import { useSupabaseAuth } from "@/utils/auth/useSupabaseAuth";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "@/utils/theme";
import { useEffect, useState } from "react";
import { getActiveFamilyGroup } from "@/lib/familyGroups";

export default function Index() {
  const { session, loading: authLoading } = useSupabaseAuth();
  const { colors } = useTheme();
  const [checkingGroup, setCheckingGroup] = useState(false);
  const [hasGroup, setHasGroup] = useState(null);

  useEffect(() => {
    if (session && !authLoading) {
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
  }, [session, authLoading]);

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
