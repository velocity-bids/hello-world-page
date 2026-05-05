import { supabase } from "@/integrations/supabase/client";
import { withMutation } from "../helpers";
import type { MutationResult } from "./types";

export interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  address?: string;
  date_of_birth?: string | null;
  id_document_url?: string | null;
  avatar_url?: string | null;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileData
): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("profiles")
      .update(data)
      .eq("user_id", userId)
  );
}
