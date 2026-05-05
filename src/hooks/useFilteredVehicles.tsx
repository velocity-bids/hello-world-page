import { useState, useEffect, useRef } from "react";
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
  const requestIdRef = useRef(0);

  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    const fetchVehicles = async () => {
      const { data, error } = await getFilteredVehicles({ brand, maxMileage, page, pageSize });

      // Discard stale responses from superseded requests
      if (currentRequestId !== requestIdRef.current) return;

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching vehicles:", error);
        }
        setHasMore(false);
      } else {
        if (page === 0) {
          // First page (or filter changed) — always replace the list
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
