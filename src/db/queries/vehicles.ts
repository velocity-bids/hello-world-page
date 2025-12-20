import { supabase } from "@/integrations/supabase/client";
import type { Vehicle } from "@/types";
import type { QueryResult, QueryListResult } from "./types";

// Fetch a single vehicle by ID
export const getVehicleById = async (id: string): Promise<QueryResult<Vehicle>> => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// Fetch all active and approved vehicles
export const getActiveVehicles = async (): Promise<QueryListResult<Vehicle>> => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch filtered vehicles with pagination
interface FilteredVehiclesParams {
  brand?: string;
  maxMileage: number;
  page: number;
  pageSize: number;
}

export const getFilteredVehicles = async ({
  brand,
  maxMileage,
  page,
  pageSize,
}: FilteredVehiclesParams): Promise<QueryListResult<Vehicle>> => {
  try {
    let query = supabase
      .from("vehicles")
      .select("*")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .lte("mileage", maxMileage)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (brand && brand !== "all") {
      query = query.eq("make", brand);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch vehicles by seller ID
export const getVehiclesBySeller = async (sellerId: string): Promise<QueryListResult<Vehicle>> => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch active vehicles by seller ID
export const getActiveVehiclesBySeller = async (sellerId: string): Promise<QueryListResult<Vehicle>> => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("seller_id", sellerId)
      .eq("status", "active")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch past (non-active) vehicles by seller ID
export const getPastVehiclesBySeller = async (sellerId: string): Promise<QueryListResult<Vehicle>> => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("seller_id", sellerId)
      .neq("status", "active")
      .order("auction_end_time", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch featured vehicles (top bid vehicles for homepage)
interface FeaturedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url: string | null;
  current_bid: number | null;
  auction_end_time: string;
}

export const getFeaturedVehicles = async (limit = 8): Promise<QueryListResult<FeaturedVehicle>> => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, make, model, year, image_url, current_bid, auction_end_time")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .order("current_bid", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch unique vehicle brands
export const getVehicleBrands = async (): Promise<QueryListResult<string>> => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("make")
      .eq("status", "active")
      .eq("approval_status", "approved");

    if (error) throw error;

    const uniqueBrands = Array.from(new Set(data.map((v) => v.make))).sort();
    return { data: uniqueBrands, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Fetch all vehicles for admin (includes all statuses)
export const getAllVehiclesAdmin = async (): Promise<QueryListResult<Vehicle>> => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};
