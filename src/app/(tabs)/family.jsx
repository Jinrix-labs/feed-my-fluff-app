import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/utils/theme";
import { User, UserPlus, Crown, Shield, Settings, Heart, Plus, Edit2, Trash2 } from "lucide-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { getFamily, addFamilyMember, deleteFamilyMember } from "@/lib/family";
import { getPets, addPet, updatePet, deletePet } from "@/lib/pets";

const FAMILY_EMOJIS = ["👨", "👩", "👧", "👦", "🧓", "👴"];
const PET_EMOJIS = ["🐕", "🐈", "🐰", "🐹", "🐦", "🐢", "🐠", "🐴"];

let cachedFamilyMembers = [];
let cachedPets = [];
let hasLoadedFamilyData = false;

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [familyMembers, setFamilyMembers] = useState(cachedFamilyMembers);
  const [pets, setPets] = useState(cachedPets);
  const [loading, setLoading] = useState(!hasLoadedFamilyData);
  const [hasLoaded, setHasLoaded] = useState(hasLoadedFamilyData);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    name: "",
    emoji: FAMILY_EMOJIS[0],
  });
  const [savingMember, setSavingMember] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [petFormData, setPetFormData] = useState({
    name: "",
    breed: "",
    age: "",
    emoji: "🐕",
  });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  const updateFamilyMembers = (updater) => {
    setFamilyMembers((previous) => {
      const next =
        typeof updater === "function" ? updater(previous) : updater;
      cachedFamilyMembers = next;
      return next;
    });
  };

  const updatePets = (updater) => {
    setPets((previous) => {
      const next =
        typeof updater === "function" ? updater(previous) : updater;
      cachedPets = next;
      return next;
    });
  };

  const resetMemberForm = () => {
    setMemberFormData({
      name: "",
      emoji: FAMILY_EMOJIS[0],
    });
  };

  // Fetch family members and pets from Supabase
  const fetchData = async () => {
    setLoading(!hasLoadedFamilyData);
    try {
      const [familyData, petsData] = await Promise.all([
        getFamily(),
        getPets(),
      ]);
      updateFamilyMembers(familyData || []);
      updatePets(petsData || []);
      hasLoadedFamilyData = true;
      setHasLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        "Error",
        `Failed to fetch data: ${error.message || error}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!fontsLoaded || (!hasLoaded && loading)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: "Poppins_400Regular", color: colors.textMuted }}>
          Loading...
        </Text>
      </View>
    );
  }

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setSavingMember(false);
    resetMemberForm();
  };

  const handleAddMember = () => {
    resetMemberForm();
    setShowMemberModal(true);
  };

  const handleSaveMember = async () => {
    if (!memberFormData.name.trim()) {
      Alert.alert("Error", "Please enter a name for the family member.");
      return;
    }

    try {
      setSavingMember(true);
      const newMember = await addFamilyMember({
        name: memberFormData.name.trim(),
        emoji: memberFormData.emoji,
        is_admin: false,
      });
      updateFamilyMembers((prev) => [...prev, newMember]);
      closeMemberModal();
    } catch (error) {
      console.error("Error adding family member:", error);
      Alert.alert(
        "Error",
        `Failed to add family member: ${error.message || error}`
      );
      setSavingMember(false);
    }
  };

  const handleAddPet = () => {
    setEditingPet(null);
    setPetFormData({
      name: "",
      breed: "",
      age: "",
      emoji: "🐕",
    });
    setShowPetModal(true);
  };

  const handleEditPet = (pet) => {
    setEditingPet(pet);
    setPetFormData({
      name: pet.name || "",
      breed: pet.breed || "",
      age: pet.age?.toString() || "",
      emoji: pet.emoji || "🐕",
    });
    setShowPetModal(true);
  };

  const handleSavePet = async () => {
    if (!petFormData.name.trim()) {
      Alert.alert("Error", "Please enter a pet name.");
      return;
    }

    try {
      const petData = {
        name: petFormData.name.trim(),
        breed: petFormData.breed.trim() || null,
        age: petFormData.age ? parseInt(petFormData.age) : null,
        emoji: petFormData.emoji || "🐕",
      };

      if (editingPet) {
        const updated = await updatePet(editingPet.id, petData);
        updatePets((current) =>
          current.map((p) => (p.id === updated.id ? updated : p)),
        );
      } else {
        const newPet = await addPet(petData);
        updatePets((current) => [...current, newPet]);
      }

      setShowPetModal(false);
      setEditingPet(null);
      setPetFormData({ name: "", breed: "", age: "", emoji: "🐕" });
    } catch (error) {
      console.error("Error saving pet:", error);
      Alert.alert(
        "Error",
        `Failed to save pet: ${error.message || error}`
      );
    }
  };

  const handleDeletePet = async (pet) => {
    Alert.alert(
      "Delete Pet",
      `Are you sure you want to delete ${pet.name}? This will also delete all feed entries for this pet.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePet(pet.id);
              updatePets((current) => current.filter((p) => p.id !== pet.id));
            } catch (error) {
              console.error("Error deleting pet:", error);
              Alert.alert(
                "Error",
                `Failed to delete pet: ${error.message || error}`
              );
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (member) => {
    if (member.is_admin) {
      Alert.alert(
        "Cannot Remove",
        "You cannot remove yourself from the family.",
      );
      return;
    }

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.name} from the family?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFamilyMember(member.id);
              updateFamilyMembers((current) =>
                current.filter((m) => m.id !== member.id),
              );
            } catch (error) {
              console.error("Error removing family member:", error);
              Alert.alert(
                "Error",
                `Failed to remove family member: ${error.message || error}`
              );
            }
          },
        },
      ],
    );
  };

  const FamilyMemberCard = ({ member }) => {
    const isCurrentUser = member.is_admin; // Assuming first admin is current user

    return (
      <TouchableOpacity
        onPress={() => {
          if (!isCurrentUser) {
            handleRemoveMember(member);
          }
        }}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: isCurrentUser ? 2 : 1,
          borderColor: isCurrentUser ? colors.primary : colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Member avatar */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: isCurrentUser
              ? colors.primaryBackground
              : colors.backgroundTertiary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 16,
          }}
        >
          <Text style={{ fontSize: 28 }}>{member.emoji}</Text>
        </View>

        {/* Member info */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 18,
                color: colors.text,
                marginRight: 8,
              }}
            >
              {member.name}
            </Text>
            {member.is_admin && <Crown size={16} color={colors.primary} />}
          </View>

          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            {isCurrentUser
              ? "You (Admin)"
              : member.is_admin
                ? "Admin"
                : "Family Member"}
          </Text>
        </View>

        {/* Status indicator */}
        {member.is_admin && (
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 12,
                color: "#FFFFFF",
              }}
            >
              Admin
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Fixed Header */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          zIndex: 10,
        }}
      >
        <View
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
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
                <User size={20} color={colors.primary} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 24,
                    color: colors.text,
                  }}
                >
                  Family
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Manage family members
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddMember}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <UserPlus size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
        {/* Admin Info Card */}
        <View
          style={{
            backgroundColor: colors.primaryBackground,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Shield
            size={24}
            color={colors.primary}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 16,
                color: colors.text,
                marginBottom: 4,
              }}
            >
              Admin Permissions
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 18,
              }}
            >
              As an admin, you can edit and delete any feed entries. Family
              members can only log new feeds.
            </Text>
          </View>
        </View>

        {/* Family Members List */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Family Members ({familyMembers.length})
          </Text>

          {familyMembers.map((member) => (
            <FamilyMemberCard key={member.id} member={member} />
          ))}
        </View>

        {/* Pets Section */}
        <View style={{ marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 18,
                color: colors.text,
              }}
            >
              Pets ({pets.length})
            </Text>
            <TouchableOpacity
              onPress={handleAddPet}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                Add Pet
              </Text>
            </TouchableOpacity>
          </View>

          {pets.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Heart size={32} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                No pets yet
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                Add your first pet to start tracking their feedings!
              </Text>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
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
                  <Text style={{ fontSize: 28 }}>{pet.emoji}</Text>
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
                    {pet.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 14,
                      color: colors.textSecondary,
                    }}
                  >
                    {pet.breed || "Unknown breed"}
                    {pet.age ? ` • ${pet.age} ${pet.age === 1 ? "year" : "years"} old` : ""}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleEditPet(pet)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primaryBackground,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Edit2 size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePet(pet)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Trash2 size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* App Settings */}
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Settings
              size={20}
              color={colors.icon}
              style={{ marginRight: 12 }}
            />
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 16,
                color: colors.text,
              }}
            >
              App Settings
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: colors.textMuted,
            }}
          >
            →
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Family Member Modal */}
      <Modal
        visible={showMemberModal}
        transparent
        animationType="fade"
        onRequestClose={closeMemberModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 24,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 22,
                color: colors.text,
                marginBottom: 16,
              }}
            >
              Add Family Member
            </Text>

            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              Name *
            </Text>
            <TextInput
              value={memberFormData.name}
              onChangeText={(text) =>
                setMemberFormData((prev) => ({ ...prev, name: text }))
              }
              placeholder="Enter member name"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.background,
                borderWidth: 2,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 16,
                fontFamily: "Poppins_400Regular",
                fontSize: 16,
                color: colors.text,
                marginBottom: 20,
              }}
            />

            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 12,
              }}
            >
              Avatar
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {FAMILY_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() =>
                    setMemberFormData((prev) => ({ ...prev, emoji }))
                  }
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor:
                      memberFormData.emoji === emoji
                        ? colors.primary
                        : colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor:
                      memberFormData.emoji === emoji
                        ? colors.primary
                        : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 26 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={closeMemberModal}
                disabled={savingMember}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  opacity: savingMember ? 0.7 : 1,
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
                onPress={handleSaveMember}
                disabled={savingMember}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  opacity: savingMember ? 0.7 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 16,
                    color: "#FFFFFF",
                  }}
                >
                  {savingMember ? "Adding..." : "Add Member"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pet Modal */}
      <Modal
        visible={showPetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowPetModal(false);
          setEditingPet(null);
        }}
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
              maxHeight: "80%",
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 24,
                color: colors.text,
                marginBottom: 24,
              }}
            >
              {editingPet ? "Edit Pet" : "Add Pet"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Pet Name */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Pet Name *
                </Text>
                <TextInput
                  value={petFormData.name}
                  onChangeText={(text) =>
                    setPetFormData({ ...petFormData, name: text })
                  }
                  placeholder="Enter pet name"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontFamily: "Poppins_400Regular",
                    fontSize: 16,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Breed */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Breed (optional)
                </Text>
                <TextInput
                  value={petFormData.breed}
                  onChangeText={(text) =>
                    setPetFormData({ ...petFormData, breed: text })
                  }
                  placeholder="e.g., Golden Retriever"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontFamily: "Poppins_400Regular",
                    fontSize: 16,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Age */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Age (optional)
                </Text>
                <TextInput
                  value={petFormData.age}
                  onChangeText={(text) =>
                    setPetFormData({ ...petFormData, age: text.replace(/[^0-9]/g, "") })
                  }
                  placeholder="e.g., 3"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontFamily: "Poppins_400Regular",
                    fontSize: 16,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Emoji */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Emoji
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  {PET_EMOJIS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() =>
                          setPetFormData({ ...petFormData, emoji })
                        }
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor:
                            petFormData.emoji === emoji
                              ? colors.primary
                              : colors.background,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 2,
                          borderColor:
                            petFormData.emoji === emoji
                              ? colors.primary
                              : colors.border,
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>{emoji}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 24,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowPetModal(false);
                  setEditingPet(null);
                  setPetFormData({ name: "", breed: "", age: "", emoji: "🐕" });
                }}
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
                onPress={handleSavePet}
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
                  {editingPet ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
