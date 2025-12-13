import { supabase } from "@/integrations/supabase/client";
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
  try {
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", userId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
