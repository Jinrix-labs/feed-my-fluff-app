import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  MoreHorizontal,
  PawPrint,
  Clock,
  Trash2,
  Edit,
} from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

export default function FeedCard({ feed, isAdmin, onEdit, onDelete }) {
  const { colors } = useTheme();
  const [showActions, setShowActions] = React.useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const getCardBackground = (index) => {
    const backgrounds = [
      colors.feedCardYellow,
      colors.feedCardPink,
      colors.feedCardPurple,
      colors.feedCardGreen,
      colors.feedCardBlue,
    ];
    return backgrounds[index % backgrounds.length];
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFamilyEmoji = (name) => {
    const emojis = ["👨", "👩", "👧", "👦", "🧓", "👴"];
    const index = name.length % emojis.length;
    return emojis[index];
  };

  const getFoodEmoji = (foodType) => {
    const foodEmojis = {
      "dry food": "🥘",
      "wet food": "🍽️",
      treats: "🦴",
      snacks: "🍪",
      medicine: "💊",
    };
    return foodEmojis[foodType.toLowerCase()] || "🍽️";
  };

  return (
    <View
      style={{
        backgroundColor: getCardBackground(feed.id),
        borderRadius: 24,
        marginHorizontal: 24,
        marginBottom: 16,
        padding: 20,
        transform: [{ rotate: `${((feed.id % 3) - 1) * 1}deg` }],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Header with paw prints */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <PawPrint
            size={16}
            color={colors.textMuted}
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontSize: 20 }}>{getFoodEmoji(feed.food_type)}</Text>
        </View>

        {isAdmin && (
          <TouchableOpacity
            onPress={() => setShowActions(!showActions)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MoreHorizontal size={18} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main content */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontFamily: "Poppins_700Bold",
            fontSize: 20,
            color: colors.text,
            marginBottom: 4,
          }}
        >
          {feed.food_type}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>
            {feed.family_members?.emoji || getFamilyEmoji(feed.family_members?.name || "")}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_500Medium",
              fontSize: 16,
              color: colors.textSecondary,
            }}
          >
            Fed by {feed.family_members?.name || "Unknown"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Clock
            size={14}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: colors.textMuted,
            }}
          >
            {formatTime(feed.fed_at)}
          </Text>
        </View>
      </View>

      {/* Admin actions */}
      {showActions && isAdmin && (
        <View
          style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}
        >
          <TouchableOpacity
            onPress={() => {
              setShowActions(false);
              onEdit(feed);
            }}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Edit size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 12,
                color: "#FFFFFF",
              }}
            >
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowActions(false);
              onDelete(feed);
            }}
            style={{
              backgroundColor: colors.error,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Trash2 size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 12,
                color: "#FFFFFF",
              }}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
