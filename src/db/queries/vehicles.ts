import { supabase } from "@/integrations/supabase/client";
import type { Vehicle } from "@/types";
import { withQuery, withQueryList } from "../helpers";
import type { QueryResult, QueryListResult } from "./types";

// Fetch a single vehicle by ID
export const getVehicleById = async (id: string): Promise<QueryResult<Vehicle>> => {
  return withQuery(() =>
    supabase.from("vehicles").select("translation:*").eq("id", id).single()
  );
};

// Fetch all active and approved vehicles
export const getActiveVehicles = async (): Promise<QueryListResult<Vehicle>> => {
  return withQueryList(() =>
    supabase
      .from("vehicles")
      .select("translation:*")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
  );
};

// Fetch filtered vehicles with pagination
interface FilteredVehiclesParams {
  brands?: string[];
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  maxMileage: number;
  page: number;
  pageSize: number;
}

export const getFilteredVehicles = async ({
  brands,
  model,
  yearFrom,
  yearTo,
  maxMileage,
  page,
  pageSize,
}: FilteredVehiclesParams): Promise<QueryListResult<Vehicle>> => {
  return withQueryList(async () => {
    let query = supabase
      .from("vehicles")
      .select("translation:*")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .lte("mileage", maxMileage)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (brands && brands.length > 0) {
      query = query.in("make", brands);
    }

    if (model && model !== "all") {
      query = query.eq("model", model);
    }

    if (yearFrom) {
      query = query.gte("year", yearFrom);
    }

    if (yearTo) {
      query = query.lte("year", yearTo);
    }

    return query;
  });
};

// Fetch vehicles by seller ID
export const getVehiclesBySeller = async (sellerId: string): Promise<QueryListResult<Vehicle>> => {
  return withQueryList(() =>
    supabase
      .from("vehicles")
      .select("translation:*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
  );
};

// Fetch active vehicles by seller ID
export const getActiveVehiclesBySeller = async (sellerId: string): Promise<QueryListResult<Vehicle>> => {
  return withQueryList(() =>
    supabase
      .from("vehicles")
      .select("translation:*")
      .eq("seller_id", sellerId)
      .eq("status", "active")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
  );
};

// Fetch past (non-active) vehicles by seller ID
export const getPastVehiclesBySeller = async (sellerId: string): Promise<QueryListResult<Vehicle>> => {
  return withQueryList(() =>
    supabase
      .from("vehicles")
      .select("translation:*")
      .eq("seller_id", sellerId)
      .neq("status", "active")
      .order("auction_end_time", { ascending: false })
  );
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
  return withQueryList(() =>
    supabase
      .from("vehicles")
      .select("translation:id, make, model, year, image_url, current_bid, auction_end_time")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .order("current_bid", { ascending: false })
      .limit(limit)
  );
};

// Fetch unique vehicle brands
export const getVehicleBrands = async (): Promise<QueryListResult<string>> => {
  return withQueryList(async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("translation:make")
      .eq("status", "active")
      .eq("approval_status", "approved");

    if (error) {
      return { data: null, error };
    }

    const uniqueBrands = Array.from(new Set((data ?? []).map((v) => v.make))).sort();
    return { data: uniqueBrands, error: null };
  });
};

// Fetch unique vehicle models for a given make
export const getVehicleModels = async (make: string): Promise<QueryListResult<string>> => {
  return withQueryList(async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("translation:model")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .eq("make", make);

    if (error) {
      return { data: null, error };
    }

    const uniqueModels = Array.from(new Set((data ?? []).map((v) => v.model))).sort();
    return { data: uniqueModels, error: null };
  });
};

// Fetch all vehicles for admin (includes all statuses)
export const getAllVehiclesAdmin = async (): Promise<QueryListResult<Vehicle>> => {
  return withQueryList(() =>
    supabase
      .from("vehicles")
      .select("translation:*")
      .order("created_at", { ascending: false })
  );
};
