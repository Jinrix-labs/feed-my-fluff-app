import { supabase } from "./supabase";

/**
 * Get pets for a specific family group
 * @param {string} groupId - The family group ID
 */
export async function getPets(groupId) {
  if (!groupId) throw new Error("Group ID is required");

  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPet(id) {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Add a pet to a family group
 * @param {Object} pet - Pet data including group_id, name, breed, etc.
 */
export async function addPet(pet) {
  if (!pet.group_id) throw new Error("Group ID is required");

  const { data, error } = await supabase
    .from("pets")
    .insert(pet)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePet(id, updates) {
  const { data, error } = await supabase
    .from("pets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePet(id) {
  const { error } = await supabase
    .from("pets")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

