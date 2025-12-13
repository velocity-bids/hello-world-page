import { supabase } from "@/integrations/supabase/client";

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

export async function getAllUsers() {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, user_id, display_name, avatar_url, verified, rating, vehicles_sold, member_since, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return { data: null, error: profilesError };
  }

  // Get all user roles
  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id, role");

  if (rolesError) {
    return { data: null, error: rolesError };
  }

  // Map roles to users
  const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);
  const usersWithRoles = profiles?.map((profile) => ({
    ...profile,
    role: rolesMap.get(profile.user_id) || "user",
  }));

  return { data: usersWithRoles as AdminUser[] | null, error: null };
}

// Note: setUserRole mutation has been moved to src/db/mutations/user-roles.ts
