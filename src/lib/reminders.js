import { supabase } from "./supabase";

export async function getReminders() {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .order("reminder_time", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addReminder(reminder) {
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

