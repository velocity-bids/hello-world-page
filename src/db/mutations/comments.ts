import { supabase } from "@/integrations/supabase/client";
import type { MutationResult } from "./types";

export interface CreateCommentData {
  vehicle_id: string;
  user_id: string;
  content: string;
}

/**
 * Create a new comment on a vehicle
 */
export async function createComment(data: CreateCommentData): Promise<MutationResult> {
  try {
    const { error } = await supabase.from("comments").insert(data);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a comment by ID
 */
export async function deleteComment(commentId: string): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
