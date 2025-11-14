import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVehicleBrands = () => {
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("make")
        .eq("status", "active")
        .eq("approval_status", "approved");

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching brands:", error);
        }
      } else {
        const uniqueBrands = Array.from(new Set(data.map(v => v.make))).sort();
        setBrands(uniqueBrands);
      }
      setLoading(false);
    };

    fetchBrands();
  }, []);

  return { brands, loading };
};
