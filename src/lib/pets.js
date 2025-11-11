import { supabase } from "./supabase";

export async function getPets() {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
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

export async function addPet(pet) {
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

