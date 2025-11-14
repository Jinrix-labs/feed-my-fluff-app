import { supabase } from "./supabase";

/**
 * Get reminders for a specific family group
 * @param {string} groupId - The family group ID
 */
export async function getReminders(groupId) {
  if (!groupId) throw new Error("Group ID is required");

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("group_id", groupId)
    .order("reminder_time", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Add a reminder to a family group
 * @param {Object} reminder - Reminder data including group_id, name, food_type, etc.
 */
export async function addReminder(reminder) {
  if (!reminder.group_id) throw new Error("Group ID is required");

  const { data, error } = await supabase
    .from("reminders")
    .insert(reminder)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReminder(id, updates) {
  const { data, error } = await supabase
    .from("reminders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReminder(id) {
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

