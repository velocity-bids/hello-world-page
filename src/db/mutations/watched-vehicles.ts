import { supabase } from "@/integrations/supabase/client";
import type { MutationResult } from "./types";

export interface AddToWatchlistData {
  user_id: string;
  vehicle_id: string;
}

/**
 * Add a vehicle to user's watchlist
 */
export async function addToWatchlist(data: AddToWatchlistData): Promise<MutationResult> {
  try {
    const { error } = await supabase.from("watched_vehicles").insert(data);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Remove a vehicle from user's watchlist
 */
export async function removeFromWatchlist(
  userId: string,
  vehicleId: string
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("watched_vehicles")
      .delete()
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update notification preferences for a watched vehicle
 */
export async function updateWatchlistPreferences(
  userId: string,
  vehicleId: string,
  notifyOnSale: boolean,
  notifyOnBid: boolean
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("watched_vehicles")
      .update({
        notify_on_sale: notifyOnSale,
        notify_on_bid: notifyOnBid,
      })
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
