import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/types";
import { withQuery, withQueryList } from "../helpers";
import type { QueryResult, QueryListResult } from "./types";

// Extended profile with additional fields
export interface FullProfile extends UserProfile {
  bio: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  id_document_url?: string | null;
}

// Public profile data returned by the secure RPC function
interface PublicProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  member_since: string;
  rating: number | null;
  vehicles_sold: number | null;
  verified: boolean | null;
  created_at: string;
}

// Fetch public profile by user ID using secure RPC function
export const getPublicProfile = async (userId: string): Promise<QueryResult<UserProfile>> => {
  return withQuery(async () => {
    const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: userId });

    if (error) {
      return { data: null, error };
    }

    const row = (data as PublicProfileRow[] | null)?.[0];
    if (!row) {
      return { data: null, error: null };
    }

    return {
      data: {
        display_name: row.display_name,
        verified: row.verified,
        avatar_url: row.avatar_url,
        rating: row.rating,
        vehicles_sold: row.vehicles_sold,
        member_since: row.member_since,
      },
      error: null,
    };
  });
};

// Fetch multiple public profiles by user IDs using secure RPC function
export const getPublicProfiles = async (userIds: string[]): Promise<QueryListResult<UserProfile & { user_id: string }>> => {
  return withQueryList(async () => {
    if (userIds.length === 0) {
      return { data: [], error: null };
    }

    const uniqueIds = [...new Set(userIds)];
    const { data, error } = await supabase.rpc("get_public_profiles", { p_user_ids: uniqueIds });

    if (error) {
      return { data: null, error };
    }

    const rows = (data as PublicProfileRow[] | null) || [];
    return {
      data: rows.map((row) => ({
        user_id: row.user_id,
        display_name: row.display_name,
        verified: row.verified,
        avatar_url: row.avatar_url,
        rating: row.rating,
        vehicles_sold: row.vehicles_sold,
        member_since: row.member_since,
      })),
      error: null,
    };
  });
};

// Fetch full profile (for profile page display) - uses secure RPC for public data
export const getFullProfile = async (userId: string): Promise<QueryResult<FullProfile>> => {
  return withQuery(async () => {
    const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: userId });

    if (error) {
      return { data: null, error };
    }

    const row = (data as PublicProfileRow[] | null)?.[0];
    if (!row) {
      return { data: null, error: null };
    }

    // Bio is not exposed in public profile, return null for it
    return {
      data: {
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        bio: null,
        member_since: row.member_since,
        rating: row.rating,
        vehicles_sold: row.vehicles_sold,
        verified: row.verified,
      },
      error: null,
    };
  });
};

// Fetch user's own profile (for settings) - uses direct table access (RLS restricts to own profile)
export const getOwnProfile = async (userId: string): Promise<QueryResult<FullProfile & { address: string | null; date_of_birth: string | null; id_document_url: string | null }>> => {
  return withQuery(() =>
    supabase
      .from("profiles")
      .select("translation:*")
      .eq("user_id", userId)
      .maybeSingle()
  );
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

// Fetch profile display info for comments/bids using secure RPC function
export const getProfileDisplayInfo = async (userId: string): Promise<QueryResult<{ display_name: string | null; avatar_url: string | null }>> => {
  return withQuery(async () => {
    const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: userId });

    if (error) {
      return { data: null, error };
    }

    const row = (data as PublicProfileRow[] | null)?.[0];
    if (!row) {
      return { data: null, error: null };
    }

    return {
      data: {
        display_name: row.display_name,
        avatar_url: row.avatar_url,
      },
      error: null,
    };
  });
};
