import { supabase } from "@/integrations/supabase/client";
import { withMutation } from "../helpers";
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
  return withMutation(() => supabase.from("comments").insert(data));
}

/**
 * Delete a comment by ID, scoped to the owning user
 */
export async function deleteComment(commentId: string, userId: string): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId)
  );
}
