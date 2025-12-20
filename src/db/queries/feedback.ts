import { supabase } from "@/integrations/supabase/client";
import type { QueryResult, QueryListResult } from "./types";

interface FeedbackBase {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
}

// Fetch feedback for a user (reviewee)
export const getFeedbackForUser = async (userId: string): Promise<QueryListResult<FeedbackBase>> => {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("id, rating, comment, created_at, reviewer_id")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Check if feedback exists for a transaction
export const checkExistingFeedback = async (
  reviewerId: string,
  revieweeId: string,
  vehicleId: string
): Promise<QueryResult<{ id: string } | null>> => {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("id")
      .eq("reviewer_id", reviewerId)
      .eq("reviewee_id", revieweeId)
      .eq("vehicle_id", vehicleId)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};
