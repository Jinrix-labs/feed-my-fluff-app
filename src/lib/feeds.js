import { supabase } from "./supabase";

export async function addFeed(feed) {
  const { data, error } = await supabase
    .from("feeds")
    .insert(feed)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFeeds() {
  const { data, error } = await supabase
    .from("feeds")
    .select(`
      id,
      food_type,
      fed_at,
      notes,
      family_members(name, emoji),
      pets(name, emoji)
    `)
    .order("fed_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteFeed(id) {
  const { error } = await supabase
    .from("feeds")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

