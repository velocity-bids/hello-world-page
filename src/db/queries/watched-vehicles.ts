import { supabase } from "@/integrations/supabase/client";
import { withQuery, withQueryList } from "../helpers";
import type { QueryResult, QueryListResult } from "./types";

export interface WatchedVehicle {
  id: string;
  vehicle_id: string;
  notify_on_sale: boolean;
  notify_on_bid: boolean;
  vehicles: {
    id: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    current_bid: number;
    image_url: string;
    auction_end_time: string;
    status: string;
  };
}

// Fetch watched vehicles for a user
export const getWatchedVehiclesForUser = async (userId: string): Promise<QueryListResult<WatchedVehicle>> => {
  return withQueryList(async () => {
    const { data, error } = await supabase
      .from("watched_vehicles")
      .select(`
        id,
        vehicle_id,
        notify_on_sale,
        notify_on_bid,
        vehicles (
          id,
          make,
          model,
          year,
          mileage,
          current_bid,
          image_url,
          auction_end_time,
          status
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { data: data as unknown as WatchedVehicle[] | null, error };
  });
};

// Check if user is watching a vehicle
export const isVehicleWatched = async (userId: string, vehicleId: string): Promise<QueryResult<boolean>> => {
  const result = await withQuery(async () => {
    const { data, error } = await supabase
      .from("watched_vehicles")
      .select("translation:id")
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId)
      .maybeSingle();

    return { data: !!data, error };
  });

  return result.error ? { data: false, error: result.error } : result;
};
