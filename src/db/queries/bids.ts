import { supabase } from "@/integrations/supabase/client";
import type { Bid, BidWithVehicle } from "@/types";
import type { QueryListResult } from "./types";

// Fetch recent bids for a vehicle (limited)
export const getRecentBidsForVehicle = async (vehicleId: string, limit = 3): Promise<QueryListResult<Bid>> => {
  try {
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("amount", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch all bids for a vehicle (for bid history modal)
export const getAllBidsForVehicle = async (vehicleId: string): Promise<QueryListResult<Bid>> => {
  try {
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("amount", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch bids by user with vehicle details
export const getBidsByUser = async (userId: string): Promise<QueryListResult<BidWithVehicle>> => {
  try {
    const { data, error } = await supabase
      .from("bids")
      .select(`
        id,
        amount,
        created_at,
        bidder_id,
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          image_url,
          current_bid,
          auction_end_time,
          status
        )
      `)
      .eq("bidder_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: (data as unknown as BidWithVehicle[]) || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};
