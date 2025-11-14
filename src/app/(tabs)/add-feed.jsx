import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/theme";
import { Plus, PawPrint, Clock, User, ChefHat, Heart } from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

import { getFamily } from "@/lib/family";
import { getPets } from "@/lib/pets";
import { addFeed } from "@/lib/feeds";
import { getActiveFamilyGroup } from "@/lib/familyGroups";

export default function AddFeedScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [selectedFoodType, setSelectedFoodType] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [feedTime, setFeedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState(null);

  const foodTypes = [
    { id: "dry-food", name: "Dry Food", emoji: "🥘" },
    { id: "wet-food", name: "Wet Food", emoji: "🍽️" },
    { id: "treats", name: "Treats", emoji: "🦴" },
    { id: "snacks", name: "Snacks", emoji: "🍪" },
    { id: "medicine", name: "Medicine", emoji: "💊" },
  ];

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  // ✅ Fetch directly from Supabase
  const fetchData = async (activeGroupId) => {
    if (!activeGroupId) return;
    
    try {
      const [familyData, petsData] = await Promise.all([
        getFamily(),
        getPets(activeGroupId),
      ]);
      setFamilyMembers(familyData);
      setPets(petsData);
      
      // Auto-select first pet if only one exists
      if (petsData && petsData.length === 1) {
        setSelectedPet(petsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not load data.");
    } finally {
      setLoading(false);
    }
  };

  // Get active family group on mount
  useEffect(() => {
    const initializeGroup = async () => {
      try {
        const group = await getActiveFamilyGroup();
        if (group) {
          setGroupId(group.id);
          await fetchData(group.id);
        } else {
          setLoading(false);
          Alert.alert(
            "No Family Group",
            "Please create or join a family group to add feeds.",
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

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: "Poppins_400Regular", color: colors.textMuted }}>
          Loading...
        </Text>
      </View>
    );
  }

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
  const formatDate = (date) =>
    date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  
  const handleTimePress = () => {
    setTempTime(feedTime);
    setShowTimePicker(true);
  };
  
  const handleTimeConfirm = () => {
    setFeedTime(tempTime);
    setShowTimePicker(false);
  };
  
  const updateTime = (type, value) => {
    const newTime = new Date(tempTime);
    if (type === "hour") newTime.setHours(value);
    if (type === "minute") newTime.setMinutes(value);
    if (type === "date") {
      const newDate = new Date(value);
      newTime.setFullYear(newDate.getFullYear());
      newTime.setMonth(newDate.getMonth());
      newTime.setDate(newDate.getDate());
    }
    setTempTime(newTime);
  };

  // ✅ Submit feed via Supabase
  const handleSubmit = async () => {
    if (!selectedFoodType || !selectedMember || !selectedPet) {
      Alert.alert("Missing Information", "Please select food type, who fed, and which pet.");
      return;
    }

    if (!groupId) {
      Alert.alert("Error", "No family group found. Please create or join a group first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const feedData = {
        group_id: groupId,
        family_member_id: selectedMember,
        pet_id: selectedPet,
        food_type: foodTypes.find((f) => f.id === selectedFoodType)?.name,
        fed_at: feedTime.toISOString(),
        notes: notes.trim() || null,
      };

      await addFeed(feedData);

      const memberName = familyMembers.find(
        (m) => m.id === selectedMember
      )?.name;
      const petName = pets.find((p) => p.id === selectedPet)?.name;

      Alert.alert(
        "Feed Logged! 🎉",
        `Successfully logged ${feedData.food_type} for ${petName} by ${memberName}`,
        [
          { text: "Add Another", onPress: resetForm },
          { text: "Close", style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Feed submission error:", error);
      Alert.alert("Error", `Failed to log feeding: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFoodType(null);
    setSelectedMember(null);
    setSelectedPet(pets.length === 1 ? pets[0].id : null);
    setFeedTime(new Date());
    setNotes("");
  };

  const FoodTypeButton = ({ foodType }) => {
    const isSelected = selectedFoodType === foodType.id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedFoodType(foodType.id)}
        style={{
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.border,
          borderRadius: 24,
          padding: 16,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 24, marginRight: 12 }}>{foodType.emoji}</Text>
        <Text
          style={{
            fontFamily: "Poppins_500Medium",
            fontSize: 16,
            color: isSelected ? "#FFFFFF" : colors.text,
          }}
        >
          {foodType.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const FamilyMemberButton = ({ member }) => {
    const isSelected = selectedMember === member.id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedMember(member.id)}
        style={{
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.border,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 12,
          marginRight: 12,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 8 }}>{member.emoji}</Text>
        <Text
          style={{
            fontFamily: "Poppins_500Medium",
            fontSize: 14,
            color: isSelected ? "#FFFFFF" : colors.text,
          }}
        >
          {member.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const PetButton = ({ pet }) => {
    const isSelected = selectedPet === pet.id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedPet(pet.id)}
        style={{
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.border,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 12,
          marginRight: 12,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 8 }}>{pet.emoji}</Text>
        <Text
          style={{
            fontFamily: "Poppins_500Medium",
            fontSize: 14,
            color: isSelected ? "#FFFFFF" : colors.text,
          }}
        >
          {pet.name}
        </Text>
      </TouchableOpacity>
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              <Plus size={20} color={colors.primary} />
            </View>
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 24,
                color: colors.text,
              }}
            >
              Add Feed
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              marginLeft: 52,
            }}
          >
            Log a new feeding for your pet! 🐾
          </Text>
        </View>
      </View>

      {/* Scrollable Form */}
      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 120, // Extra space for submit button
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Food Type */}
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <ChefHat size={20} color={colors.text} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                What did you feed?
              </Text>
            </View>

            {foodTypes.map((foodType) => (
              <FoodTypeButton key={foodType.id} foodType={foodType} />
            ))}
          </View>

          {/* Pet Selection */}
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Heart size={20} color={colors.text} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                Which pet?
              </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {pets.length === 0 ? (
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textMuted,
                    fontStyle: "italic",
                  }}
                >
                  No pets found. Add a pet in the Family tab first.
                </Text>
              ) : (
                pets.map((pet) => <PetButton key={pet.id} pet={pet} />)
              )}
            </View>
          </View>

          {/* Family Members */}
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <User size={20} color={colors.text} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                Who fed the pet?
              </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {familyMembers.length === 0 ? (
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textMuted,
                    fontStyle: "italic",
                  }}
                >
                  No family members found. Add a family member in the Family tab first.
                </Text>
              ) : (
                familyMembers.map((member) => (
                  <FamilyMemberButton key={member.id} member={member} />
                ))
              )}
            </View>
          </View>

          {/* Time */}
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Clock size={20} color={colors.text} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                When was it fed?
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleTimePress}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 16,
                    color: colors.text,
                  }}
                >
                  {formatDate(feedTime)} at {formatTime(feedTime)}
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 12,
                    color: colors.textMuted,
                    marginTop: 4,
                  }}
                >
                  Tap to change
                </Text>
              </View>
              <Clock size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 16,
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Notes (optional)
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                fontFamily: "Poppins_400Regular",
                fontSize: 14,
                color: colors.text,
                textAlignVertical: "top",
                minHeight: 80,
              }}
            />
          </View>

          {/* Submit */}
          <View style={{ marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!selectedFoodType || !selectedMember || !selectedPet || isSubmitting}
              style={{
                backgroundColor:
                  !selectedFoodType || !selectedMember || !selectedPet || isSubmitting
                    ? colors.textMuted
                    : colors.primary,
                borderRadius: 24,
                paddingVertical: 16,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <PawPrint size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 16,
                  color: "#FFFFFF",
                }}
              >
                {isSubmitting ? "Logging Feed..." : "Log Feed"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: insets.bottom + 24,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 20,
                  color: colors.text,
                  marginBottom: 24,
                }}
              >
                Select Date & Time
              </Text>

              {/* Date Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 12,
                  }}
                >
                  Date
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={tempTime.getDate().toString()}
                      onChangeText={(text) => {
                        const day = parseInt(text) || 1;
                        if (day >= 1 && day <= 31) {
                          const newTime = new Date(tempTime);
                          newTime.setDate(day);
                          setTempTime(newTime);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 2,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 16,
                        fontFamily: "Poppins_400Regular",
                        fontSize: 16,
                        color: colors.text,
                        textAlign: "center",
                      }}
                      placeholder="DD"
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 12,
                        color: colors.textMuted,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      Day
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={(tempTime.getMonth() + 1).toString()}
                      onChangeText={(text) => {
                        const month = parseInt(text) || 1;
                        if (month >= 1 && month <= 12) {
                          const newTime = new Date(tempTime);
                          newTime.setMonth(month - 1);
                          setTempTime(newTime);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 2,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 16,
                        fontFamily: "Poppins_400Regular",
                        fontSize: 16,
                        color: colors.text,
                        textAlign: "center",
                      }}
                      placeholder="MM"
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 12,
                        color: colors.textMuted,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      Month
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={tempTime.getFullYear().toString()}
                      onChangeText={(text) => {
                        const year = parseInt(text) || new Date().getFullYear();
                        if (year >= 2020 && year <= 2100) {
                          const newTime = new Date(tempTime);
                          newTime.setFullYear(year);
                          setTempTime(newTime);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={4}
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 2,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 16,
                        fontFamily: "Poppins_400Regular",
                        fontSize: 16,
                        color: colors.text,
                        textAlign: "center",
                      }}
                      placeholder="YYYY"
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 12,
                        color: colors.textMuted,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      Year
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 12,
                    color: colors.textMuted,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  {formatDate(tempTime)}
                </Text>
              </View>

              {/* Time Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 12,
                  }}
                >
                  Time
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={tempTime.getHours().toString().padStart(2, "0")}
                      onChangeText={(text) => {
                        const hour = parseInt(text) || 0;
                        if (hour >= 0 && hour <= 23) {
                          updateTime("hour", hour);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 2,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 16,
                        fontFamily: "Poppins_400Regular",
                        fontSize: 16,
                        color: colors.text,
                        textAlign: "center",
                      }}
                      placeholder="HH"
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 12,
                        color: colors.textMuted,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      Hour
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Poppins_700Bold",
                      fontSize: 24,
                      color: colors.text,
                      alignSelf: "center",
                      marginTop: 16,
                    }}
                  >
                    :
                  </Text>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={tempTime.getMinutes().toString().padStart(2, "0")}
                      onChangeText={(text) => {
                        const minute = parseInt(text) || 0;
                        if (minute >= 0 && minute <= 59) {
                          updateTime("minute", minute);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 2,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 16,
                        fontFamily: "Poppins_400Regular",
                        fontSize: 16,
                        color: colors.text,
                        textAlign: "center",
                      }}
                      placeholder="MM"
                    />
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 12,
                        color: colors.textMuted,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      Minute
                    </Text>
                  </View>
                </View>
              </View>

              {/* Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_500Medium",
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleTimeConfirm}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_500Medium",
                      fontSize: 16,
                      color: "#FFFFFF",
                    }}
                  >
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingAnimatedView>
    </View>
  );
}

