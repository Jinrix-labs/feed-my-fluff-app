import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/utils/theme";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Mail, Lock, PawPrint } from "lucide-react-native";

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: Platform.OS === "web" ? window.location.origin : undefined,
        },
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Check your email! 📧",
          "We've sent you a magic link. Click it to sign in.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPassword = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          Alert.alert("Error", error.message);
        } else {
          Alert.alert(
            "Success! 🎉",
            "Account created! Please check your email to verify your account.",
            [{ text: "OK", onPress: () => setMode("signin") }]
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Alert.alert("Error", error.message);
        } else {
          // Navigation will happen automatically via auth state listener
          router.replace("/(tabs)/today");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontFamily: "Poppins_400Regular", color: colors.textMuted }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
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
            <PawPrint size={40} color={colors.primary} />
          </View>
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 32,
              color: colors.text,
              marginBottom: 8,
            }}
          >
            FeedMyFluff
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 16,
              color: colors.textSecondary,
            }}
          >
            {mode === "signin" ? "Sign in to continue" : "Create your account"}
          </Text>
        </View>

        {/* Auth Form */}
        <View style={{ marginBottom: 24 }}>
          {/* Email Input */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Mail size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                Email
              </Text>
            </View>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
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

          {/* Password Input (only for email/password mode) */}
          {mode === "signin" && (
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Lock size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Password
                </Text>
              </View>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
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
          )}

          {/* Email/Password Button */}
          {mode === "signin" && (
            <TouchableOpacity
              onPress={handleEmailPassword}
              disabled={loading}
              style={{
                backgroundColor: loading ? colors.textMuted : colors.primary,
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 16,
                  color: "#FFFFFF",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Magic Link Button */}
          <TouchableOpacity
            onPress={handleMagicLink}
            disabled={loading}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                {loading ? "Sending..." : "Send Magic Link 📧"}
              </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          {mode === "signin" && (
            <TouchableOpacity
              onPress={() => setMode("signup")}
              style={{
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                Don't have an account?{" "}
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    color: colors.primary,
                  }}
                >
                  Sign Up
                </Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Sign In Button (when in signup mode) */}
          {mode === "signup" && (
            <>
              <TouchableOpacity
                onPress={handleEmailPassword}
                disabled={loading}
                style={{
                  backgroundColor: loading ? colors.textMuted : colors.primary,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 16,
                    color: "#FFFFFF",
                  }}
                >
                  {loading ? "Creating..." : "Create Account"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode("signin")}
                style={{
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Already have an account?{" "}
                    <Text
                      style={{
                        fontFamily: "Poppins_700Bold",
                        color: colors.primary,
                      }}
                    >
                      Sign In
                    </Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

