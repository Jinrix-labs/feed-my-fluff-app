import { supabase } from "./supabase";

export async function getFamily() {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addFamilyMember(member) {
  const { data, error } = await supabase
    .from("family_members")
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFamilyMember(id) {
  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

