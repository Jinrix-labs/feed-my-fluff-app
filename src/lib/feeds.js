import { getSupabase } from "./supabase";

/**
 * Add a feed entry
 * @param {Object} feed - Feed data including group_id, pet_id, food_type, etc.
 */
export async function addFeed(feed) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Insert without select to avoid relationship detection
  const { data: insertData, error: insertError } = await supabase
    .from("feeds")
    .insert({
      ...feed,
      fed_by: user.id,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  // Then fetch the full record using minimal query
  const { data, error } = await supabase
    .from("feeds")
    .select("id, food_type, fed_at, notes, group_id, family_member_id, pet_id")
    .eq("id", insertData.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get feeds for a specific family group
 * @param {string} groupId - The family group ID
 */
export async function getFeeds(groupId) {
  if (!groupId) throw new Error("Group ID is required");

  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");

  // Use Supabase relationship syntax with explicit column names
  const { data, error } = await supabase
    .from("feeds")
    .select(`
      id,
      food_type,
      fed_at,
      notes,
      family_members:family_member_id (
        id,
        name,
        emoji
      ),
      pets:pet_id (
        id,
        name,
        emoji
      )
    `)
    .eq("group_id", groupId)
    .order("fed_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch feeds: ${error.message || JSON.stringify(error)}`);
  }

  return data || [];
}

/**
 * Delete a feed entry (only if user created it)
 */
export async function deleteFeed(id) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error("Supabase not initialized");

  const { error } = await supabase
    .from("feeds")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Subscribe to realtime updates for feeds in a group
 * @param {string} groupId - The family group ID
 * @param {Function} callback - Callback function when feeds change
 * @returns {Promise<Function>} Promise that resolves to unsubscribe function
 */
export async function subscribeToFeeds(groupId, callback) {
  if (!groupId) {
    console.warn("Cannot subscribe to feeds: groupId is required");
    return () => { };
  }

  const supabase = await getSupabase();
  if (!supabase) {
    console.warn("Cannot subscribe to feeds: Supabase not initialized");
    return () => { };
  }

  const channel = supabase
    .channel(`feeds:${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "*", // INSERT, UPDATE, DELETE
        schema: "public",
        table: "feeds",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

