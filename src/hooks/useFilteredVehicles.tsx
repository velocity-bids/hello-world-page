import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "./useVehicles";

interface FilterParams {
  brand?: string;
  maxMileage: number;
  page: number;
  pageSize: number;
}

export const useFilteredVehicles = ({ brand, maxMileage, page, pageSize }: FilterParams) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      
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

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching vehicles:", error);
        }
        setHasMore(false);
      } else {
        if (page === 0) {
          setVehicles(data || []);
        } else {
          setVehicles(prev => [...prev, ...(data || [])]);
        }
        setHasMore(data && data.length === pageSize);
      }
      setLoading(false);
    };

    fetchVehicles();
  }, [brand, maxMileage, page, pageSize]);

  return { vehicles, loading, hasMore };
};
