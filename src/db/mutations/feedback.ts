import { supabase } from "@/integrations/supabase/client";
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
  try {
    const { error } = await supabase.from("feedback").insert(data);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
