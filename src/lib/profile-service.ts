import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/types";

/**
 * Fetches a single user's public profile
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from("public_profiles")
    .select("display_name, verified, avatar_url, rating, vehicles_sold, member_since")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) {
      console.error("Error fetching profile:", error);
    }
    return null;
  }

  return data;
};

/**
 * Fetches profiles for multiple user IDs in a single batch
 */
export const fetchUserProfiles = async (
  userIds: string[]
): Promise<Map<string, UserProfile>> => {
  if (userIds.length === 0) return new Map();

  const uniqueIds = [...new Set(userIds)];
  
  const { data, error } = await supabase
    .from("public_profiles")
    .select("user_id, display_name, verified, avatar_url, rating, vehicles_sold, member_since")
    .in("user_id", uniqueIds);

  if (error) {
    if (import.meta.env.DEV) {
      console.error("Error fetching profiles:", error);
    }
    return new Map();
  }

  const profileMap = new Map<string, UserProfile>();
  data?.forEach((profile) => {
    if (profile.user_id) {
      profileMap.set(profile.user_id, {
        display_name: profile.display_name,
        verified: profile.verified,
        avatar_url: profile.avatar_url,
        rating: profile.rating,
        vehicles_sold: profile.vehicles_sold,
        member_since: profile.member_since,
      });
    }
  });

  return profileMap;
};

/**
 * Enriches an array of items with user profiles
 * @param items - Array of items with a userId field
 * @param getUserId - Function to extract user ID from an item
 * @returns Items with profiles attached
 */
export const enrichWithProfiles = async <T extends object>(
  items: T[],
  getUserId: (item: T) => string
): Promise<(T & { profiles: UserProfile | null })[]> => {
  const userIds = items.map(getUserId);
  const profileMap = await fetchUserProfiles(userIds);

  return items.map((item) => ({
    ...item,
    profiles: profileMap.get(getUserId(item)) || null,
  }));
};
