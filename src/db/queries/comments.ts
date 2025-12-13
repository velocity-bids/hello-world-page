import { supabase } from "@/integrations/supabase/client";
import type { Comment } from "@/types";
import type { QueryListResult } from "./types";

// Fetch comments for a vehicle
export const getCommentsForVehicle = async (vehicleId: string): Promise<QueryListResult<Comment>> => {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};
