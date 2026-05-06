import { supabase } from "@/integrations/supabase/client";
import type { Comment } from "@/types";
import { withQueryList } from "../helpers";
import type { QueryListResult } from "./types";

// Fetch comments for a vehicle
export const getCommentsForVehicle = async (vehicleId: string): Promise<QueryListResult<Comment>> => {
  return withQueryList(() =>
    supabase
      .from("comments")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })
  );
};
