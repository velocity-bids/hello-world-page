import { supabase } from "@/integrations/supabase/client";
import { withMutation } from "../helpers";
import type { MutationResult } from "./types";

export interface CreateVehicleData {
  seller_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin?: string | null;
  description?: string | null;
  reserve_price?: number | null;
  starting_bid?: number;
  auction_end_time: string;
  images: string[];
  image_url?: string | null;
  status?: string;
  horsepower?: number | null;
  engine_type?: string | null;
  exterior_color?: string;
  interior_color?: string;
  engine_displacement?: number | null;
  fuel_type?: string;
  transmission?: string;
  doors?: number;
  imported?: boolean;
  import_country?: string | null;
  maintenance_book?: boolean;
  smoker?: boolean;
  number_of_owners?: number | null;
}

export interface UpdateVehicleData {
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  vin?: string | null;
  description?: string | null;
  reserve_price?: number | null;
  starting_bid?: number;
  auction_end_time?: string;
  images?: string[];
  image_url?: string | null;
  status?: string;
  approval_status?: string;
  admin_notes?: string | null;
  horsepower?: number | null;
  engine_type?: string | null;
  exterior_color?: string;
  interior_color?: string;
  engine_displacement?: number | null;
  fuel_type?: string;
  transmission?: string;
  doors?: number;
  imported?: boolean;
  import_country?: string | null;
  maintenance_book?: boolean;
  smoker?: boolean;
  number_of_owners?: number | null;
}

/**
 * Create a new vehicle listing
 */
export async function createVehicle(data: CreateVehicleData): Promise<MutationResult> {
  return withMutation(() => supabase.from("vehicles").insert(data));
}

/**
 * Update a vehicle listing by ID, restricted to the owner
 */
export async function updateVehicle(
  vehicleId: string,
  sellerId: string,
  data: UpdateVehicleData
): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("vehicles")
      .update(data)
      .eq("id", vehicleId)
      .eq("seller_id", sellerId)
  );
}

/**
 * Update vehicle approval status (admin action)
 */
export async function updateVehicleApprovalStatus(
  vehicleId: string,
  status: string,
  adminNotes?: string | null
): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("vehicles")
      .update({
        approval_status: status,
        admin_notes: adminNotes || null,
      })
      .eq("id", vehicleId)
  );
}

/**
 * Delete a vehicle listing (seller must own it, no bids placed)
 */
export async function deleteVehicle(
  vehicleId: string,
  sellerId: string
): Promise<MutationResult> {
  return withMutation(async () => {
    const { count, error: countError } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("vehicle_id", vehicleId);

    if (countError) throw countError;
    if (count && count > 0) {
      throw new Error("Cannot delete a listing that has bids");
    }

    return supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleId)
      .eq("seller_id", sellerId);
  });
}

/**
 * Delete a vehicle listing (admin action - no seller check)
 */
export async function deleteVehicleAdmin(vehicleId: string): Promise<MutationResult> {
  return withMutation(() =>
    supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleId)
  );
}
