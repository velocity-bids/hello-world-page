import { supabase } from "@/integrations/supabase/client";
import { withMutation } from "../helpers";
import type { MutationResult } from "./types";

export interface CreateFeedbackData {
  reviewer_id: string;
  reviewee_id: string;
  vehicle_id: string;
  rating: number;
  comment?: string | null;
}

/**
 * Create feedback for a transaction
 */
export async function createFeedback(data: CreateFeedbackData): Promise<MutationResult> {
  return withMutation(() => supabase.from("feedback").insert(data));
}
