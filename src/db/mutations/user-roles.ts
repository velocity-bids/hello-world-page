import { supabase } from "@/integrations/supabase/client";
import { withMutation } from "../helpers";
import type { MutationResult } from "./types";

/**
 * Set or update a user's role (atomic upsert)
 */
export async function setUserRole(
  userId: string,
  role: "admin" | "user"
): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" })
  );
}
