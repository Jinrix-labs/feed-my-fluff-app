import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/theme";
import { BarChart3, TrendingUp, Award, Calendar } from "lucide-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { getFeeds } from "@/lib/feeds";
import { getActiveFamilyGroup } from "@/lib/familyGroups";
import { useRealtimeFeeds } from "@/utils/useRealtimeFeeds";
import { Alert } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Get active family group and fetch statistics
  useEffect(() => {
    const initializeGroup = async () => {
      try {
        const group = await getActiveFamilyGroup();
        if (group) {
          setGroupId(group.id);
          await fetchStatistics(group.id);
        } else {
          setLoading(false);
          Alert.alert(
            "No Family Group",
            "Please create or join a family group to view statistics.",
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
    // Refresh statistics when any feed change occurs (INSERT, UPDATE, DELETE)
    if (groupId) {
      fetchStatistics(groupId);
    }
  });

  // Fetch statistics from Supabase
  const fetchStatistics = async (activeGroupId) => {
    if (!activeGroupId) return;
    
    setLoading(true);
    try {
      // Get feeds for the active group
      const feeds = await getFeeds(activeGroupId);
      
      // Calculate statistics from feeds
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayFeeds = feeds.filter(
        (feed) => new Date(feed.fed_at) >= today
      );
      
      // Calculate trends (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const recentFeeds = feeds.filter(
        (feed) => new Date(feed.fed_at) >= sevenDaysAgo
      );
      
      // Group by date for trends
      const trendsMap = new Map();
      recentFeeds.forEach((feed) => {
        const date = new Date(feed.fed_at).toISOString().split('T')[0];
        trendsMap.set(date, (trendsMap.get(date) || 0) + 1);
      });
      
      const trends = Array.from(trendsMap.entries())
        .map(([feed_date, feed_count]) => ({ feed_date, feed_count }))
        .sort((a, b) => a.feed_date.localeCompare(b.feed_date));
      
      // Calculate food types
      const foodTypesMap = new Map();
      feeds.forEach((feed) => {
        const type = feed.food_type || 'Unknown';
        foodTypesMap.set(type, (foodTypesMap.get(type) || 0) + 1);
      });
      
      const foodTypes = Array.from(foodTypesMap.entries())
        .map(([food_type, count]) => ({ food_type, count }))
        .sort((a, b) => b.count - a.count);
      
      // Calculate family member stats
      const memberMap = new Map();
      feeds.forEach((feed) => {
        const member = feed.family_members;
        if (member) {
          const key = member.name || 'Unknown';
          if (!memberMap.has(key)) {
            memberMap.set(key, { name: key, emoji: member.emoji || '👤', feed_count: 0 });
          }
          memberMap.get(key).feed_count++;
        }
      });
      
      const familyMembers = Array.from(memberMap.values())
        .sort((a, b) => b.feed_count - a.feed_count);
      
      const stats = {
        today: {
          total_feeds: todayFeeds.length,
          family_members_fed: new Set(todayFeeds.map((f) => f.family_members?.name).filter(Boolean)).size,
        },
        averagePerDay: feeds.length > 0 ? Math.round(feeds.length / 30) : "0",
        trends,
        foodTypes,
        familyMembers,
      };
      
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      Alert.alert(
        "Error",
        `Failed to fetch statistics: ${error.message || error}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: "Poppins_400Regular", color: colors.textMuted }}>
          Loading...
        </Text>
      </View>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: color + "20",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Icon size={18} color={color} />
        </View>
        <Text
          style={{
            fontFamily: "Poppins_500Medium",
            fontSize: 14,
            color: colors.textSecondary,
          }}
        >
          {title}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: "Poppins_700Bold",
          fontSize: 24,
          color: colors.text,
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const FoodTypeChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + parseInt(item.count), 0);
    const maxCount = Math.max(...data.map((item) => parseInt(item.count)));

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primaryBackground,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <BarChart3 size={18} color={colors.primary} />
          </View>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 16,
              color: colors.text,
            }}
          >
            Food Types This Month
          </Text>
        </View>

        {data.map((item, index) => {
          const percentage =
            total > 0 ? (parseInt(item.count) / total) * 100 : 0;
          const barWidth =
            maxCount > 0 ? (parseInt(item.count) / maxCount) * 100 : 0;
          const barColor = [
            colors.primary,
            "#FF8A5B",
            "#8B5CF6",
            "#10B981",
            "#F59E0B",
          ][index % 5];

          return (
            <View key={item.food_type} style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.text,
                  }}
                >
                  {item.food_type}
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 14,
                    color: barColor,
                  }}
                >
                  {item.count} ({Math.round(percentage)}%)
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: colors.border,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const FamilyMemberChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primaryBackground,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Award size={18} color={colors.primary} />
          </View>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 16,
              color: colors.text,
            }}
          >
            Family Feeding This Week
          </Text>
        </View>

        {data.map((member, index) => {
          const barColor = [colors.primary, "#FF8A5B", "#8B5CF6", "#10B981"][
            index % 4
          ];

          return (
            <View
              key={member.name}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 12 }}>
                {member.emoji}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.text,
                  }}
                >
                  {member.name}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: barColor,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 12,
                    color: "#FFFFFF",
                  }}
                >
                  {member.feed_count} feeds
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const TrendChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxCount = Math.max(...data.map((item) => parseInt(item.feed_count)));
    const chartHeight = 120;
    const chartWidth = screenWidth - 80; // Account for padding

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primaryBackground,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <TrendingUp size={18} color={colors.primary} />
          </View>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 16,
              color: colors.text,
            }}
          >
            Feeding Trends (7 Days)
          </Text>
        </View>

        <View style={{ height: chartHeight, justifyContent: "flex-end" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              height: "100%",
            }}
          >
            {data.map((item, index) => {
              const barHeight =
                maxCount > 0
                  ? (parseInt(item.feed_count) / maxCount) * (chartHeight - 20)
                  : 0;

              return (
                <View
                  key={item.feed_date}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    marginHorizontal: 2,
                  }}
                >
                  <View
                    style={{
                      width: "80%",
                      height: Math.max(barHeight, 4),
                      backgroundColor: colors.primary,
                      borderRadius: 2,
                      marginBottom: 8,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 10,
                      color: colors.textMuted,
                      textAlign: "center",
                    }}
                  >
                    {new Date(item.feed_date).toLocaleDateString("en", {
                      weekday: "short",
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

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
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
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
                marginRight: 12,
              }}
            >
              <BarChart3 size={20} color={colors.primary} />
            </View>
            <View>
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 24,
                  color: colors.text,
                }}
              >
                Statistics
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                Feeding insights & trends 📊
              </Text>
            </View>
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
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 100,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                color: colors.textMuted,
              }}
            >
              Loading statistics...
            </Text>
          </View>
        ) : !statistics ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 100,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 18,
                color: colors.text,
                marginBottom: 8,
              }}
            >
              No data available
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              Start logging feeds to see statistics
            </Text>
          </View>
        ) : (
          <>
            {/* Today's Stats */}
            <StatCard
              icon={Calendar}
              title="Today's Feeds"
              value={statistics.today?.total_feeds || "0"}
              subtitle={`${statistics.today?.family_members_fed || 0} family members participated`}
              color={colors.primary}
            />

            <StatCard
              icon={TrendingUp}
              title="Average Per Day"
              value={statistics.averagePerDay || "0"}
              subtitle="This month's average"
              color="#10B981"
            />

            {/* Trend Chart */}
            <TrendChart data={statistics.trends} />

            {/* Food Types Chart */}
            <FoodTypeChart data={statistics.foodTypes} />

            {/* Family Members Chart */}
            <FamilyMemberChart data={statistics.familyMembers} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
