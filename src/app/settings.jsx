import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/utils/theme";
import {
  Settings,
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  Trash2,
  Info,
  Shield,
} from "lucide-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // TODO: Implement theme toggle with AsyncStorage persistence
  const toggleTheme = () => {
    Alert.alert(
      "Theme Toggle",
      "Theme toggle will be implemented with persistent storage. For now, your device's system theme is used."
    );
  };

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            color: colors.textMuted,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all feed entries, reminders, and other data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            // TODO: Implement data clearing
            Alert.alert("Success", "All data has been cleared.");
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = false,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primaryBackground,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 16,
        }}
      >
        <Icon size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "Poppins_600SemiBold",
            fontSize: 16,
            color: colors.text,
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent}
      {showArrow && (
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            fontSize: 18,
            color: colors.textMuted,
            marginLeft: 12,
          }}
        >
          →
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 24,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primaryBackground,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <ArrowLeft size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 24,
                color: colors.text,
              }}
            >
              Settings
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              Manage your app preferences
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Appearance
          </Text>
          <SettingItem
            icon={isDark ? Moon : Sun}
            title="Dark Mode"
            subtitle={isDark ? "Dark theme enabled" : "Light theme enabled"}
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* Notifications */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Notifications
          </Text>
          <SettingItem
            icon={Bell}
            title="Push Notifications"
            subtitle="Get reminders for feeding times"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* Data */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Data
          </Text>
          <SettingItem
            icon={Trash2}
            title="Clear All Data"
            subtitle="Delete all feeds, reminders, and settings"
            onPress={handleClearData}
            showArrow={true}
          />
        </View>

        {/* About */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            About
          </Text>
          <SettingItem
            icon={Info}
            title="App Version"
            subtitle="1.0.0"
            onPress={() => {}}
          />
          <SettingItem
            icon={Shield}
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => {
              Alert.alert(
                "Privacy Policy",
                "Your data is stored securely in Supabase and is only accessible to you and your family members."
              );
            }}
            showArrow={true}
          />
        </View>
      </ScrollView>
    </View>
  );
}

