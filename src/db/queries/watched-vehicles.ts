import { supabase } from "@/integrations/supabase/client";
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
  try {
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

    if (error) throw error;
    return { data: (data as unknown as WatchedVehicle[]) || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Check if user is watching a vehicle
export const isVehicleWatched = async (userId: string, vehicleId: string): Promise<QueryResult<boolean>> => {
  try {
    const { data, error } = await supabase
      .from("watched_vehicles")
      .select("id")
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId)
      .maybeSingle();

    if (error) throw error;
    return { data: !!data, error: null };
  } catch (error) {
    return { data: false, error: error as Error };
  }
};
