import { supabase } from "@/integrations/supabase/client";
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
  try {
    const { error } = await supabase.from("vehicles").insert(data);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update a vehicle listing by ID
 */
export async function updateVehicle(
  vehicleId: string,
  data: UpdateVehicleData
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("vehicles")
      .update(data)
      .eq("id", vehicleId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update vehicle approval status (admin action)
 */
export async function updateVehicleApprovalStatus(
  vehicleId: string,
  status: string,
  adminNotes?: string | null
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("vehicles")
      .update({
        approval_status: status,
        admin_notes: adminNotes || null,
      })
      .eq("id", vehicleId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a vehicle listing (seller must own it, no bids placed)
 */
export async function deleteVehicle(
  vehicleId: string,
  sellerId: string
): Promise<MutationResult> {
  try {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleId)
      .eq("seller_id", sellerId);
    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
