import * as Notifications from "expo-notifications";

/**
 * Schedule notifications for a reminder
 * @param {Object} reminder - Reminder object with id, name, food_type, reminder_time, days_of_week, is_active
 * @returns {Promise<string[]>} Array of notification identifiers
 */
export async function scheduleReminderNotifications(reminder) {
  if (!reminder.is_active) {
    return [];
  }

  const notificationIds = [];
  const [hours, minutes] = reminder.reminder_time.split(":").map(Number);
  
  // Validate time values
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.error(`Invalid time format: ${reminder.reminder_time}`);
    return [];
  }
  
  // Schedule a notification for each day of the week
  for (const dayOfWeek of reminder.days_of_week) {
    try {
      // dayOfWeek in database: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
      // Expo Notifications uses: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
      // So we need to convert: database day -> Expo day
      // Database 1 (Mon) -> Expo 2
      // Database 2 (Tue) -> Expo 3
      // ...
      // Database 7 (Sun) -> Expo 1
      const expoWeekday = dayOfWeek === 7 ? 1 : dayOfWeek + 1;
      
      // Validate weekday
      if (expoWeekday < 1 || expoWeekday > 7) {
        console.error(`Invalid weekday: ${dayOfWeek} (converted to ${expoWeekday})`);
        continue;
      }
      
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🐾 Feeding Reminder",
          body: `${reminder.name} - ${reminder.food_type}`,
          sound: true,
          data: {
            reminderId: reminder.id,
            type: "feeding_reminder",
          },
        },
        trigger: {
          weekday: expoWeekday,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
      
      notificationIds.push(identifier);
    } catch (error) {
      console.error(`Error scheduling notification for reminder ${reminder.id} on day ${dayOfWeek} at ${hours}:${minutes}:`, error);
      // Continue with other days even if one fails
    }
  }

  return notificationIds;
}

/**
 * Cancel all notifications for a reminder
 * @param {string[]} notificationIds - Array of notification identifiers to cancel
 */
export async function cancelReminderNotifications(notificationIds) {
  if (!notificationIds || notificationIds.length === 0) {
    return;
  }

  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error(`Error canceling notification ${id}:`, error);
    }
  }
}

/**
 * Cancel all notifications for a reminder by finding them via reminder ID
 * @param {number} reminderId - The reminder ID to cancel notifications for
 */
export async function cancelReminderNotificationsById(reminderId) {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of allNotifications) {
      if (
        notification.content?.data?.reminderId === reminderId ||
        notification.content?.data?.reminderId === String(reminderId)
      ) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error(`Error canceling notifications for reminder ${reminderId}:`, error);
  }
}

/**
 * Reschedule all notifications for a reminder (cancel old ones and create new ones)
 * @param {Object} reminder - Reminder object
 */
export async function rescheduleReminderNotifications(reminder) {
  // Cancel existing notifications
  await cancelReminderNotificationsById(reminder.id);
  
  // Schedule new notifications
  return await scheduleReminderNotifications(reminder);
}

/**
 * Schedule all active reminders (useful for app startup or after loading reminders)
 * @param {Array} reminders - Array of reminder objects
 */
export async function scheduleAllReminders(reminders) {
  const results = [];
  
  for (const reminder of reminders) {
    if (reminder.is_active) {
      try {
        const ids = await scheduleReminderNotifications(reminder);
        results.push({ reminderId: reminder.id, notificationIds: ids, success: true });
      } catch (error) {
        console.error(`Error scheduling reminders for reminder ${reminder.id}:`, error);
        results.push({ reminderId: reminder.id, success: false, error });
      }
    }
  }
  
  return results;
}

