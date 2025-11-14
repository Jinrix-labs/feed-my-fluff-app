import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/theme";
import { Bell, Plus, Clock, Trash2, Edit3 } from "lucide-react-native";
import * as Notifications from "expo-notifications";
import {
  getReminders,
  addReminder,
  updateReminder,
  deleteReminder,
} from "@/lib/reminders";
import { getActiveFamilyGroup } from "@/lib/familyGroups";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    food_type: "Dry Food",
    reminder_time: "08:00",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
  });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const foodTypes = ["Dry Food", "Wet Food", "Treats", "Snacks", "Medicine"];

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }
  };

  const loadReminders = async (activeGroupId) => {
    if (!activeGroupId) return;
    
    try {
      const data = await getReminders(activeGroupId);
      setReminders(data || []);
    } catch (err) {
      console.error("Error fetching reminders:", err);
      Alert.alert(
        "Error",
        `Failed to fetch reminders: ${err.message || err}`
      );
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
          await loadReminders(group.id);
        } else {
          setLoading(false);
          Alert.alert(
            "No Family Group",
            "Please create or join a family group to view reminders.",
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
    requestNotificationPermissions();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: "Poppins_400Regular", color: colors.textMuted }}>
          Loading...
        </Text>
      </View>
    );
  }

  const handleSaveReminder = async () => {
    if (!groupId) {
      Alert.alert("Error", "No family group found. Please create or join a group first.");
      return;
    }

    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, formData);
      } else {
        await addReminder({
          ...formData,
          group_id: groupId,
        });
      }
      await loadReminders(groupId);
      setShowModal(false);
      setEditingReminder(null);
      setFormData({
        name: "",
        food_type: "Dry Food",
        reminder_time: "08:00",
        days_of_week: [1, 2, 3, 4, 5, 6, 7],
      });
    } catch (error) {
      console.error("Error saving reminder:", error);
      Alert.alert(
        "Error",
        `Failed to save reminder: ${error.message || error}`
      );
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await deleteReminder(id);
      setReminders(reminders.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting reminder:", error);
      Alert.alert(
        "Error",
        `Failed to delete reminder: ${error.message || error}`
      );
    }
  };

  const handleToggleReminder = async (reminder) => {
    try {
      await updateReminder(reminder.id, {
        is_active: !reminder.is_active,
      });
      setReminders(
        reminders.map((r) =>
          r.id === reminder.id ? { ...r, is_active: !r.is_active } : r,
        ),
      );
    } catch (error) {
      console.error("Error toggling reminder:", error);
      Alert.alert(
        "Error",
        `Failed to toggle reminder: ${error.message || error}`
      );
    }
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      name: reminder.name,
      food_type: reminder.food_type,
      reminder_time: reminder.reminder_time.substring(0, 5), // HH:MM format
      days_of_week: reminder.days_of_week,
    });
    setShowModal(true);
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
                <Bell size={20} color={colors.primary} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 24,
                    color: colors.text,
                  }}
                >
                  Reminders
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Never miss feeding time! 🔔
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Plus size={20} color="#FFFFFF" />
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
              Loading reminders...
            </Text>
          </View>
        ) : reminders.length === 0 ? (
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
              No reminders yet
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              Tap the + button to create your first feeding reminder
            </Text>
          </View>
        ) : (
          reminders.map((reminder) => {
            const time = reminder.reminder_time.substring(0, 5);
            return (
              <View
                key={reminder.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: reminder.is_active ? colors.primary : colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: 16,
                        color: colors.text,
                        marginBottom: 4,
                      }}
                    >
                      {reminder.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Poppins_400Regular",
                        fontSize: 14,
                        color: colors.textSecondary,
                      }}
                    >
                      {reminder.food_type} at {time}
                    </Text>
                  </View>

                  <Switch
                    value={reminder.is_active}
                    onValueChange={() => handleToggleReminder(reminder)}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryBackground,
                    }}
                    thumbColor={reminder.is_active ? colors.primary : colors.textMuted}
                  />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  {dayNames.map((day, index) => {
                    const isActive = reminder.days_of_week.includes(index + 1);
                    return (
                      <View
                        key={`${reminder.id}-${index}`}
                        style={{
                          backgroundColor: isActive
                            ? colors.primaryBackground
                            : colors.border,
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginRight: 6,
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Poppins_500Medium",
                            fontSize: 10,
                            color: isActive ? colors.primary : colors.textMuted,
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => openEditModal(reminder)}
                    style={{
                      padding: 8,
                      borderRadius: 12,
                      backgroundColor: colors.primaryBackground,
                    }}
                  >
                    <Edit3 size={16} color={colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Delete Reminder",
                        "Are you sure you want to delete this reminder?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => handleDeleteReminder(reminder.id),
                          },
                        ],
                      );
                    }}
                    style={{
                      padding: 8,
                      borderRadius: 12,
                      backgroundColor: colors.border,
                    }}
                  >
                    <Trash2 size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onDismiss={() => {
          setEditingReminder(null);
          setFormData({
            name: "",
            food_type: "Dry Food",
            reminder_time: "08:00",
            days_of_week: [1, 2, 3, 4, 5, 6, 7],
          });
        }}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 16,
              paddingHorizontal: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setEditingReminder(null);
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    color: colors.primary,
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                {editingReminder ? "Edit Reminder" : "New Reminder"}
              </Text>

              <TouchableOpacity onPress={handleSaveReminder}>
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    color: colors.primary,
                    fontSize: 16,
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Safe Scroll container to avoid double-mount issue */}
          <View style={{ flex: 1 }}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
            >
              {/* Form fields */}
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Reminder Name
              </Text>

              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Morning Breakfast"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 16,
                  fontFamily: "Poppins_400Regular",
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 24,
                }}
              />

              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Food Type
              </Text>

              {foodTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setFormData({ ...formData, food_type: type })}
                  style={{
                    backgroundColor:
                      formData.food_type === type
                        ? colors.primaryBackground
                        : colors.surface,
                    borderWidth: 1,
                    borderColor:
                      formData.food_type === type
                        ? colors.primary
                        : colors.border,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_500Medium",
                      fontSize: 16,
                      color:
                        formData.food_type === type
                          ? colors.primary
                          : colors.text,
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
