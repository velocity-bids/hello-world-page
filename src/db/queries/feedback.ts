import { supabase } from "@/integrations/supabase/client";
import { withQuery, withQueryList } from "../helpers";
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
  return withQueryList(() =>
    supabase
      .from("feedback")
      .select("translation:id, rating, comment, created_at, reviewer_id")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false })
  );
};

// Check if feedback exists for a transaction
export const checkExistingFeedback = async (
  reviewerId: string,
  revieweeId: string,
  vehicleId: string
): Promise<QueryResult<{ id: string } | null>> => {
  return withQuery(() =>
    supabase
      .from("feedback")
      .select("translation:id")
      .eq("reviewer_id", reviewerId)
      .eq("reviewee_id", revieweeId)
      .eq("vehicle_id", vehicleId)
      .maybeSingle()
  );
};
