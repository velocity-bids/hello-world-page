import { supabase } from "@/integrations/supabase/client";
import type { MutationResult } from "./types";

/**
 * Set or update a user's role
 */
export async function setUserRole(
  userId: string,
  role: "admin" | "user"
): Promise<MutationResult> {
  try {
    // Check if user already has a role entry
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update existing role
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    }
    
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
