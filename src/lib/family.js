import { getSupabase } from "./supabase";

export async function getFamily(groupId) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");
  
  let query = supabase
    .from("family_members")
    .select("*")
    .order("id", { ascending: true });
  
  // Filter by group_id if provided
  if (groupId) {
    query = query.eq("group_id", groupId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addFamilyMember(member) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");
  
  // Build member data - only include is_admin if it's explicitly provided
  // This allows the code to work even if the column doesn't exist yet
  const memberData = {
    name: member.name,
    emoji: member.emoji,
    group_id: member.group_id,
  };
  
  // Only include is_admin if provided (will fail if column doesn't exist, but that's expected)
  if (member.is_admin !== undefined) {
    memberData.is_admin = member.is_admin;
  }
  
  const { data, error } = await supabase
    .from("family_members")
    .insert(memberData)
    .select()
    .single();

  if (error) {
    // If error is about missing is_admin column, provide helpful message
    if (error.message && error.message.includes("is_admin")) {
      throw new Error("The is_admin column doesn't exist. Please run the SQL migration in Supabase: add-is-admin-column.sql");
    }
    throw error;
  }
  return data;
}

export async function deleteFamilyMember(id) {
  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

