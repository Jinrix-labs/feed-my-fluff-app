import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/theme";
import { PawPrint, CalendarDays, RefreshCw } from "lucide-react-native";
import FeedCard from "@/components/FeedCard";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { getFeeds, deleteFeed } from "@/lib/feeds";
import { getActiveFamilyGroup } from "@/lib/familyGroups";
import { useRealtimeFeeds } from "@/utils/useRealtimeFeeds";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [feeds, setFeeds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // For now, assuming current user is admin
  const isAdmin = true;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  // Fetch feeds from Supabase for a specific group
  const fetchFeeds = async (activeGroupId) => {
    if (!activeGroupId) return;
    
    try {
      const data = await getFeeds(activeGroupId);
      setFeeds(data || []);
    } catch (error) {
      console.error("Error fetching feeds:", error);
      Alert.alert(
        "Error",
        `Failed to fetch feeds: ${error.message || error}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Get active family group and fetch feeds
  useEffect(() => {
    const initializeGroup = async () => {
      try {
        const group = await getActiveFamilyGroup();
        if (group) {
          setGroupId(group.id);
          await fetchFeeds(group.id);
        } else {
          // No group - user needs to create or join one
          setLoading(false);
          Alert.alert(
            "No Family Group",
            "Please create or join a family group to view feeds.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error("Error initializing group:", error);
        setLoading(false);
        Alert.alert(
          "Error",
          `Failed to load family group: ${error.message || error}`
        );
      }
    };

    initializeGroup();
  }, []);

  // Subscribe to realtime feed updates
  useRealtimeFeeds(groupId, (payload) => {
    console.log("Feed changed:", payload.eventType);
    // Refresh feeds when any change occurs
    if (groupId) {
      fetchFeeds(groupId);
    }
  });

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: "Poppins_400Regular", color: colors.textMuted }}>
          Loading...
        </Text>
      </View>
    );
  }

  const handleRefresh = async () => {
    if (!groupId) return;
    setRefreshing(true);
    await fetchFeeds(groupId);
    setRefreshing(false);
  };

  const handleEdit = (feed) => {
    Alert.alert(
      "Edit Feed",
      `Edit feed entry for ${feed.food_type} by ${feed.family_member_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => {
            // TODO: Navigate to edit screen
            console.log("Edit feed", feed.id);
          },
        },
      ],
    );
  };

  const handleDelete = async (feed) => {
    Alert.alert(
      "Delete Feed",
      `Are you sure you want to delete this feed entry?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFeed(feed.id);
              setFeeds(feeds.filter((f) => f.id !== feed.id));
            } catch (error) {
              console.error("Error deleting feed:", error);
              Alert.alert(
                "Error",
                `Failed to delete feed: ${error.message || error}`
              );
            }
          },
        },
      ],
    );
  };

  // Animated header border opacity
  const headerBorderOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Fixed Header */}
      <Animated.View
        style={{
          backgroundColor: colors.background,
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          borderBottomOpacity: headerBorderOpacity,
          zIndex: 10,
        }}
      >
        <View
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        >
          {/* Header with pet emoji */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primaryBackground,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 24 }}>🐕</Text>
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 24,
                    color: colors.text,
                  }}
                >
                  FeedMyFluff
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Keep your pet happy & fed! 🐾
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <RefreshCw
                size={20}
                color={colors.icon}
                style={{
                  transform: [{ rotate: refreshing ? "180deg" : "0deg" }],
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Date header */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <CalendarDays
              size={16}
              color={colors.textMuted}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 16,
                color: colors.textSecondary,
              }}
            >
              {getCurrentDate()}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {feeds.length > 0 ? (
          <>
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                Today's Feeds ({feeds.length})
              </Text>
            </View>

            {feeds.map((feed) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.primaryBackground,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 48 }}>🍽️</Text>
            </View>

            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 24,
                color: colors.text,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              No feeds today yet
            </Text>

            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 16,
                color: colors.textMuted,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 32,
              }}
            >
              Your pet is waiting for their first meal of the day! Tap the Add
              Feed tab to log a feeding.
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}
