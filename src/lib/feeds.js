import { supabase } from "./supabase";

/**
 * Add a feed entry
 * @param {Object} feed - Feed data including group_id, pet_id, food_type, etc.
 */
export async function addFeed(feed) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("feeds")
    .insert({
      ...feed,
      fed_by: user.id,
    })
    .select()
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

  const { data, error } = await supabase
    .from("feeds")
    .select(`
      id,
      food_type,
      fed_at,
      notes,
      group_id,
      fed_by,
      family_members(name, emoji),
      pets(name, emoji),
      users:fed_by (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq("group_id", groupId)
    .order("fed_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a feed entry (only if user created it)
 */
export async function deleteFeed(id) {
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
 * @returns {Function} Unsubscribe function
 */
export function subscribeToFeeds(groupId, callback) {
  if (!groupId) {
    console.warn("Cannot subscribe to feeds: groupId is required");
    return () => {};
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

