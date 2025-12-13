import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/types";
import type { QueryResult, QueryListResult } from "./types";

// Extended profile with additional fields
export interface FullProfile extends UserProfile {
  bio: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  id_document_url?: string | null;
}

// Fetch public profile by user ID
export const getPublicProfile = async (userId: string): Promise<QueryResult<UserProfile>> => {
  try {
    const { data, error } = await supabase
      .from("public_profiles")
      .select("display_name, verified, avatar_url, rating, vehicles_sold, member_since")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// Fetch multiple public profiles by user IDs
export const getPublicProfiles = async (userIds: string[]): Promise<QueryListResult<UserProfile & { user_id: string }>> => {
  try {
    if (userIds.length === 0) {
      return { data: [], error: null };
    }

    const uniqueIds = [...new Set(userIds)];
    const { data, error } = await supabase
      .from("public_profiles")
      .select("user_id, display_name, verified, avatar_url, rating, vehicles_sold, member_since")
      .in("user_id", uniqueIds);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch full profile (for profile page display)
export const getFullProfile = async (userId: string): Promise<QueryResult<FullProfile>> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, bio, member_since, rating, vehicles_sold, verified")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// Fetch user's own profile (for settings)
export const getOwnProfile = async (userId: string): Promise<QueryResult<FullProfile & { address: string | null; date_of_birth: string | null; id_document_url: string | null }>> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// Helper: Fetch single user profile and attach to an object
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data } = await getPublicProfile(userId);
  return data;
};

// Helper: Enrich items with profile data
export const enrichWithProfiles = async <T>(
  items: T[],
  getUserId: (item: T) => string
): Promise<(T & { profiles: UserProfile | null })[]> => {
  if (items.length === 0) return [];

  const userIds = items.map(getUserId);
  const { data: profiles } = await getPublicProfiles(userIds);

  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  return items.map((item) => ({
    ...item,
    profiles: profileMap.get(getUserId(item)) || null,
  }));
};

// Fetch profile display info for comments/bids (display_name and avatar only)
export const getProfileDisplayInfo = async (userId: string): Promise<QueryResult<{ display_name: string | null; avatar_url: string | null }>> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};
