import { getSupabase } from "./supabase";

/**
 * Get all family groups for the current user
 */
export async function getUserFamilyGroups() {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("user_family_groups")
    .select(`
      group_id,
      family_groups (
        id,
        name,
        invite_code,
        created_by,
        created_at
      )
    `)
    .eq("user_id", user.id);

  if (error) throw error;
  return data?.map(item => item.family_groups).filter(Boolean) || [];
}

/**
 * Get the active family group (first one, or you can implement selection logic)
 */
export async function getActiveFamilyGroup() {
  const groups = await getUserFamilyGroups();
  return groups[0] || null;
}

/**
 * Create a new family group
 */
export async function createFamilyGroup(name) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("❌ Auth error:", authError);
    throw new Error(`Authentication error: ${authError.message}`);
  }
  if (!user) {
    console.error("❌ No user found");
    throw new Error("User not authenticated");
  }

  console.log("✅ User authenticated:", user.id);
  console.log("📝 Creating family group:", name);

  // Create the group
  const { data: group, error: groupError } = await supabase
    .from("family_groups")
    .insert({
      name,
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError) {
    console.error("❌ Error creating family group:", groupError);
    console.error("   Code:", groupError.code);
    console.error("   Message:", groupError.message);
    console.error("   Details:", groupError.details);
    throw groupError;
  }

  // Add creator to the group
  const { error: joinError } = await supabase
    .from("user_family_groups")
    .insert({
      user_id: user.id,
      group_id: group.id,
    });

  if (joinError) throw joinError;

  return group;
}

/**
 * Join a family group by invite code
 */
export async function joinFamilyGroupByInviteCode(inviteCode) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Find the group by invite code
  const { data: group, error: findError } = await supabase
    .from("family_groups")
    .select("id")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (findError || !group) {
    throw new Error("Invalid invite code");
  }

  // Check if user is already in the group
  const { data: existing } = await supabase
    .from("user_family_groups")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", group.id)
    .single();

  if (existing) {
    throw new Error("You are already a member of this group");
  }

  // Join the group
  const { error: joinError } = await supabase
    .from("user_family_groups")
    .insert({
      user_id: user.id,
      group_id: group.id,
    });

  if (joinError) throw joinError;

  return group;
}

/**
 * Get members of a family group
 */
export async function getFamilyGroupMembers(groupId) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");
  
  const { data, error } = await supabase
    .from("user_family_groups")
    .select(`
      user_id,
      joined_at,
      users:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq("group_id", groupId);

  if (error) throw error;
  return data || [];
}

/**
 * Leave a family group
 */
export async function leaveFamilyGroup(groupId) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("user_family_groups")
    .delete()
    .eq("user_id", user.id)
    .eq("group_id", groupId);

  if (error) throw error;
}

