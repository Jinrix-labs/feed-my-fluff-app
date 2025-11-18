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
  scheduleReminderNotifications,
  cancelReminderNotificationsById,
  rescheduleReminderNotifications,
  scheduleAllReminders,
} from "@/lib/notificationScheduler";
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
    shouldShowBanner: true,    // Shows the banner notification
    shouldShowList: true,      // Shows in notification list
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState({ hours: 8, minutes: 0, isPM: false });

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
      
      // Schedule all active reminders
      if (data && data.length > 0) {
        try {
          await scheduleAllReminders(data);
        } catch (error) {
          console.error("Error scheduling reminders:", error);
          // Don't show alert for scheduling errors, just log them
        }
      }
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
      let savedReminder;
      if (editingReminder) {
        savedReminder = await updateReminder(editingReminder.id, formData);
        // Reschedule notifications for updated reminder
        try {
          await rescheduleReminderNotifications({
            ...savedReminder,
            ...formData,
          });
        } catch (notifError) {
          console.error("Error rescheduling notifications:", notifError);
          // Continue even if notification scheduling fails
        }
      } else {
        savedReminder = await addReminder({
          ...formData,
          group_id: groupId,
        });
        // Schedule notifications for new reminder
        try {
          await scheduleReminderNotifications({
            ...savedReminder,
            ...formData,
          });
        } catch (notifError) {
          console.error("Error scheduling notifications:", notifError);
          // Continue even if notification scheduling fails
        }
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
      setTempTime({ hours: 8, minutes: 0, isPM: false });
      setShowTimePicker(false);
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
      // Cancel notifications before deleting
      try {
        await cancelReminderNotificationsById(id);
      } catch (notifError) {
        console.error("Error canceling notifications:", notifError);
        // Continue with deletion even if canceling notifications fails
      }
      
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
      const newActiveState = !reminder.is_active;
      await updateReminder(reminder.id, {
        is_active: newActiveState,
      });
      
      // Schedule or cancel notifications based on active state
      try {
        if (newActiveState) {
          // Schedule notifications for activated reminder
          await scheduleReminderNotifications({
            ...reminder,
            is_active: true,
          });
        } else {
          // Cancel notifications for deactivated reminder
          await cancelReminderNotificationsById(reminder.id);
        }
      } catch (notifError) {
        console.error("Error updating notifications:", notifError);
        // Continue even if notification update fails
      }
      
      setReminders(
        reminders.map((r) =>
          r.id === reminder.id ? { ...r, is_active: newActiveState } : r,
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
    const timeStr = reminder.reminder_time.substring(0, 5); // HH:MM format
    const [hours24, minutes] = timeStr.split(":").map(Number);
    
    // Convert 24-hour to 12-hour format
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    const isPM = hours24 >= 12;
    
    setFormData({
      name: reminder.name,
      food_type: reminder.food_type,
      reminder_time: timeStr,
      days_of_week: reminder.days_of_week,
    });
    setTempTime({ hours: hours12, minutes, isPM });
    setShowModal(true);
  };

  const handleTimePickerOpen = () => {
    // Parse current time from formData
    const timeStr = formData.reminder_time;
    const [hours24, minutes] = timeStr.split(":").map(Number);
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    const isPM = hours24 >= 12;
    setTempTime({ hours: hours12, minutes, isPM });
    setShowTimePicker(true);
  };

  const handleTimeConfirm = () => {
    // Convert 12-hour to 24-hour format
    let hours24 = tempTime.hours;
    if (tempTime.isPM && hours24 !== 12) {
      hours24 += 12;
    } else if (!tempTime.isPM && hours24 === 12) {
      hours24 = 0;
    }
    const timeStr = `${String(hours24).padStart(2, "0")}:${String(tempTime.minutes).padStart(2, "0")}`;
    setFormData({ ...formData, reminder_time: timeStr });
    setShowTimePicker(false);
  };

  const updateTime = (field, value) => {
    if (field === "hours") {
      let newHours = parseInt(value) || 1;
      if (newHours < 1) newHours = 1;
      if (newHours > 12) newHours = 12;
      setTempTime({ ...tempTime, hours: newHours });
    } else if (field === "minutes") {
      let newMinutes = parseInt(value) || 0;
      if (newMinutes < 0) newMinutes = 0;
      if (newMinutes > 59) newMinutes = 59;
      setTempTime({ ...tempTime, minutes: newMinutes });
    } else if (field === "isPM") {
      setTempTime({ ...tempTime, isPM: value });
    }
  };

  const toggleDay = (dayNumber) => {
    const currentDays = formData.days_of_week;
    if (currentDays.includes(dayNumber)) {
      setFormData({
        ...formData,
        days_of_week: currentDays.filter((d) => d !== dayNumber),
      });
    } else {
      setFormData({
        ...formData,
        days_of_week: [...currentDays, dayNumber].sort(),
      });
    }
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
              onPress={() => {
      setShowTimePicker(false);
      setEditingReminder(null);
      setFormData({
        name: "",
        food_type: "Dry Food",
        reminder_time: "08:00",
        days_of_week: [1, 2, 3, 4, 5, 6, 7],
      });
      setTempTime({ hours: 8, minutes: 0, isPM: false });
                setShowModal(true);
              }}
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
          setTempTime({ hours: 8, minutes: 0, isPM: false });
          setShowTimePicker(false);
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
                  setFormData({
                    name: "",
                    food_type: "Dry Food",
                    reminder_time: "08:00",
                    days_of_week: [1, 2, 3, 4, 5, 6, 7],
                  });
                  setTempTime({ hours: 8, minutes: 0, isPM: false });
                  setShowTimePicker(false);
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

              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 16,
                  color: colors.text,
                  marginTop: 24,
                  marginBottom: 12,
                }}
              >
                Reminder Time
              </Text>

              <TouchableOpacity
                onPress={handleTimePickerOpen}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Clock size={20} color={colors.primary} style={{ marginRight: 12 }} />
                  <Text
                    style={{
                      fontFamily: "Poppins_500Medium",
                      fontSize: 16,
                      color: colors.text,
                    }}
                  >
                    {formData.reminder_time}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  Tap to change
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Days of Week
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 24,
                  gap: 8,
                }}
              >
                {dayNames.map((day, index) => {
                  const dayNumber = index + 1;
                  const isSelected = formData.days_of_week.includes(dayNumber);
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleDay(dayNumber)}
                      style={{
                        backgroundColor: isSelected
                          ? colors.primaryBackground
                          : colors.surface,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        minWidth: 60,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Poppins_500Medium",
                          fontSize: 14,
                          color: isSelected
                            ? colors.primary
                            : colors.text,
                        }}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              Select Time
            </Text>

            {/* Time Selection */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginBottom: 24,
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <TextInput
                  value={tempTime.hours.toString()}
                  onChangeText={(text) => updateTime("hours", text)}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontFamily: "Poppins_400Regular",
                    fontSize: 24,
                    color: colors.text,
                    textAlign: "center",
                  }}
                  placeholder="12"
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
                  marginTop: -20,
                }}
              >
                :
              </Text>

              <View style={{ flex: 1 }}>
                <TextInput
                  value={tempTime.minutes.toString().padStart(2, "0")}
                  onChangeText={(text) => updateTime("minutes", text)}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 16,
                    fontFamily: "Poppins_400Regular",
                    fontSize: 24,
                    color: colors.text,
                    textAlign: "center",
                  }}
                  placeholder="00"
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

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => updateTime("isPM", false)}
                    style={{
                      flex: 1,
                      backgroundColor: !tempTime.isPM
                        ? colors.primaryBackground
                        : colors.background,
                      borderWidth: 2,
                      borderColor: !tempTime.isPM
                        ? colors.primary
                        : colors.border,
                      borderRadius: 12,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: 16,
                        color: !tempTime.isPM
                          ? colors.primary
                          : colors.text,
                      }}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateTime("isPM", true)}
                    style={{
                      flex: 1,
                      backgroundColor: tempTime.isPM
                        ? colors.primaryBackground
                        : colors.background,
                      borderWidth: 2,
                      borderColor: tempTime.isPM
                        ? colors.primary
                        : colors.border,
                      borderRadius: 12,
                      padding: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: 16,
                        color: tempTime.isPM
                          ? colors.primary
                          : colors.text,
                      }}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
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
                  backgroundColor: colors.border,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
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
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
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
    </View>
  );
}
