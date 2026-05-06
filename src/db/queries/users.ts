import { supabase } from "@/integrations/supabase/client";
import { withQueryList } from "../helpers";

/**
 * User type for admin dashboard queries
 * Note: Mutations are in src/db/mutations/user-roles.ts
 */
export interface AdminUser {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  rating: number | null;
  vehicles_sold: number | null;
  member_since: string;
  created_at: string;
  role?: string;
}

/**
 * Fetch all users with their roles (admin only)
 */
export async function getAllUsers() {
  return withQueryList(async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("translation:id, user_id, display_name, avatar_url, verified, rating, vehicles_sold, member_since, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return { data: null, error: profilesError };
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("translation:user_id, role");

    if (rolesError) {
      return { data: null, error: rolesError };
    }

    const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);
    const usersWithRoles = profiles?.map((profile) => ({
      ...profile,
      role: rolesMap.get(profile.user_id) || "user",
    }));

    return { data: usersWithRoles as AdminUser[] | null, error: null };
  });
}
