import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getWatchedVehiclesForUser, isVehicleWatched, type WatchedVehicle } from "@/db/queries";
import { toast } from "sonner";

export type { WatchedVehicle };

export const useWatchedVehicles = () => {
  const [watchedVehicles, setWatchedVehicles] = useState<WatchedVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchedVehicles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWatchedVehicles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await getWatchedVehiclesForUser(user.id);

      if (error) throw error;
      setWatchedVehicles(data);
    } catch (error) {
      console.error("Error fetching watched vehicles:", error);
      toast.error("Failed to load watched vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchedVehicles();

    // Set up real-time subscription
    const channel = supabase
      .channel("watched-vehicles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watched_vehicles",
        },
        () => {
          fetchWatchedVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addToWatchlist = async (vehicleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to watch auctions");
        return false;
      }

      const { error } = await supabase
        .from("watched_vehicles")
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Already watching this auction");
        } else {
          throw error;
        }
        return false;
      }

      toast.success("Added to watchlist");
      return true;
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error("Failed to add to watchlist");
      return false;
    }
  };

  const removeFromWatchlist = async (vehicleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from("watched_vehicles")
        .delete()
        .eq("user_id", user.id)
        .eq("vehicle_id", vehicleId);

      if (error) throw error;

      toast.success("Removed from watchlist");
      return true;
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Failed to remove from watchlist");
      return false;
    }
  };

  const updateNotificationPreferences = async (
    vehicleId: string,
    notifyOnSale: boolean,
    notifyOnBid: boolean
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from("watched_vehicles")
        .update({
          notify_on_sale: notifyOnSale,
          notify_on_bid: notifyOnBid,
        })
        .eq("user_id", user.id)
        .eq("vehicle_id", vehicleId);

      if (error) throw error;

      toast.success("Notification preferences updated");
      return true;
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
      return false;
    }
  };

  const isWatching = async (vehicleId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await isVehicleWatched(user.id, vehicleId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error checking watch status:", error);
      return false;
    }
  };

  return {
    watchedVehicles,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    updateNotificationPreferences,
    isWatching,
  };
};
