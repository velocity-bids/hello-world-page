import { supabase } from "@/integrations/supabase/client";
import type { Bid, BidWithVehicle } from "@/types";
import { withQueryList } from "../helpers";
import type { QueryListResult } from "./types";

// Fetch recent bids for a vehicle (limited)
export const getRecentBidsForVehicle = async (vehicleId: string, limit = 3): Promise<QueryListResult<Bid>> => {
  return withQueryList(() =>
    supabase
      .from("bids")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })
      .limit(limit)
  );
};

// Fetch all bids for a vehicle (for bid history modal)
export const getAllBidsForVehicle = async (vehicleId: string): Promise<QueryListResult<Bid>> => {
  return withQueryList(() =>
    supabase
      .from("bids")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })
  );
};

// Fetch bids by user with vehicle details
export const getBidsByUser = async (userId: string): Promise<QueryListResult<BidWithVehicle>> => {
  return withQueryList(async () => {
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

    return { data: data as unknown as BidWithVehicle[] | null, error };
  });
};
