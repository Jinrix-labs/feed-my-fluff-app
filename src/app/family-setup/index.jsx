import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import {
  createFamilyGroup,
  joinFamilyGroupByInviteCode,
  getActiveFamilyGroup,
} from "@/lib/familyGroups";
import { useTheme } from "@/utils/theme";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Users, Plus, Key, Home } from "lucide-react-native";

export default function FamilySetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  // Check if user already has a group
  useEffect(() => {
    const checkExistingGroup = async () => {
      try {
        const group = await getActiveFamilyGroup();
        if (group) {
          // User already has a group, redirect to app
          router.replace("/(tabs)/today");
        }
      } catch (error) {
        console.error("Error checking group:", error);
      } finally {
        setChecking(false);
      }
    };

    checkExistingGroup();
  }, []);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert("Error", "Please enter a family name");
      return;
    }

    setLoading(true);
    try {
      const group = await createFamilyGroup(familyName.trim());
      Alert.alert(
        "Family Created! 🎉",
        `Your family group "${group.name}" has been created!\n\nInvite Code: ${group.invite_code}\n\nShare this code with family members so they can join.`,
        [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)/today"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create family group");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    setLoading(true);
    try {
      await joinFamilyGroupByInviteCode(inviteCode.trim().toUpperCase());
      Alert.alert(
        "Joined Family! 🎉",
        "You've successfully joined the family group!",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)/today"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to join family group");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || checking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            color: colors.textMuted,
            marginTop: 16,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primaryBackground,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Users size={40} color={colors.primary} />
          </View>
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 32,
              color: colors.text,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Set Up Your Family
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            Create a new family group or join an existing one
          </Text>
        </View>

        {/* Choose Mode */}
        {mode === "choose" && (
          <View>
            {/* Create Family Button */}
            <TouchableOpacity
              onPress={() => setMode("create")}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: colors.border,
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primaryBackground,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Plus size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 18,
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  Create New Family
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Start a new family group and invite others
                </Text>
              </View>
            </TouchableOpacity>

            {/* Join Family Button */}
            <TouchableOpacity
              onPress={() => setMode("join")}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: colors.border,
                borderRadius: 20,
                padding: 24,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primaryBackground,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Key size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 18,
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  Join Existing Family
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Enter an invite code to join
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Create Family Form */}
        {mode === "create" && (
          <View>
            <TouchableOpacity
              onPress={() => setMode("choose")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 16,
                  color: colors.primary,
                }}
              >
                ← Back
              </Text>
            </TouchableOpacity>

            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Home size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Family Name
                </Text>
              </View>
              <TextInput
                placeholder="e.g., The Smith Family"
                placeholderTextColor={colors.textMuted}
                value={familyName}
                onChangeText={setFamilyName}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 16,
                  fontFamily: "Poppins_400Regular",
                  fontSize: 16,
                  color: colors.text,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreateFamily}
              disabled={loading}
              style={{
                backgroundColor: loading ? colors.textMuted : colors.primary,
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 16,
                  color: "#FFFFFF",
                }}
              >
                {loading ? "Creating..." : "Create Family"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Join Family Form */}
        {mode === "join" && (
          <View>
            <TouchableOpacity
              onPress={() => setMode("choose")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 16,
                  color: colors.primary,
                }}
              >
                ← Back
              </Text>
            </TouchableOpacity>

            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Key size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Invite Code
                </Text>
              </View>
              <TextInput
                placeholder="Enter 6-character code"
                placeholderTextColor={colors.textMuted}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 16,
                  fontFamily: "Poppins_700Bold",
                  fontSize: 20,
                  color: colors.text,
                  letterSpacing: 4,
                  textAlign: "center",
                }}
              />
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 12,
                  color: colors.textMuted,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                Ask a family member for the invite code
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleJoinFamily}
              disabled={loading}
              style={{
                backgroundColor: loading ? colors.textMuted : colors.primary,
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 16,
                  color: "#FFFFFF",
                }}
              >
                {loading ? "Joining..." : "Join Family"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

