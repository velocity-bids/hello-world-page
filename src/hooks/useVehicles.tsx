import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  current_bid: number;
  bid_count: number;
  image_url: string | null;
  auction_end_time: string;
  status: string;
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching vehicles:", error);
        }
      } else {
        setVehicles(data || []);
      }
      setLoading(false);
    };

    fetchVehicles();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("vehicles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        () => {
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { vehicles, loading };
};
