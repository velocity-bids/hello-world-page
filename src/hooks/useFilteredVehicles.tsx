import { useState, useEffect } from "react";
import { getFilteredVehicles } from "@/db/queries";
import type { Vehicle } from "@/types";

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
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      
      const { data, error } = await getFilteredVehicles({ brand, maxMileage, page, pageSize });

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching vehicles:", error);
        }
        setHasMore(false);
      } else {
        if (page === 0) {
          setVehicles(data);
        } else {
          setVehicles(prev => [...prev, ...data]);
        }
        setHasMore(data.length === pageSize);
      }
      setLoading(false);
    };

    fetchVehicles();
  }, [brand, maxMileage, page, pageSize, refreshKey]);

  const refetch = () => {
    setRefreshKey(prev => prev + 1);
  };

  const removeVehicle = (vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  return { vehicles, loading, hasMore, refetch, removeVehicle };
};
