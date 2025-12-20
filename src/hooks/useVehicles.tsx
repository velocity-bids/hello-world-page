import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getActiveVehicles } from "@/db/queries";
import type { Vehicle } from "@/types";

export type { Vehicle };

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await getActiveVehicles();

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching vehicles:", error);
        }
      } else {
        setVehicles(data);
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
