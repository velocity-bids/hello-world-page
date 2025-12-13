import { useState, useEffect } from "react";
import { getVehicleBrands } from "@/db/queries";

export const useVehicleBrands = () => {
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await getVehicleBrands();

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching brands:", error);
        }
      } else {
        setBrands(data);
      }
      setLoading(false);
    };

    fetchBrands();
  }, []);

  return { brands, loading };
};
