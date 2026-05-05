import { supabase } from "@/integrations/supabase/client";
import type { MutationResult } from "./types";

/**
 * Set or update a user's role (atomic upsert)
 */
export async function setUserRole(
  userId: string,
  role: "admin" | "user"
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
