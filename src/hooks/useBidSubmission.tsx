import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Vehicle as VehicleType } from "@/types";

interface UseBidSubmissionOptions {
  vehicle: VehicleType | null;
  userId?: string;
  onSuccess?: (amount: number) => void;
}

export const useBidSubmission = ({ vehicle, userId, onSuccess }: UseBidSubmissionOptions) => {
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const startingBid = (vehicle as any)?.starting_bid || 0;
  const minBid = vehicle
    ? vehicle.current_bid > 0
      ? vehicle.current_bid + 100
      : Math.max(startingBid, 100)
    : 0;

  const handlePlaceBid = async () => {
    if (!userId) {
      toast.error("Please sign in to place a bid");
      return false;
    }

    if (!bidAmount || !vehicle) return false;

    const amount = parseFloat(bidAmount);

    if (amount < minBid) {
      toast.error(`Minimum bid is ${formatCurrency(minBid)}`);
      return false;
    }

    setSubmitting(true);

    const { data, error } = await supabase.rpc("place_bid", {
      p_vehicle_id: vehicle.id,
      p_amount: amount,
    });

    if (error) {
      toast.error("Failed to place bid. Please try again.");
      setSubmitting(false);
      return false;
    } else if (data && typeof data === "object" && "error" in data && data.error) {
      toast.error(String(data.error));
      setSubmitting(false);
      return false;
    }

    toast.success("Bid placed successfully!");
    setBidAmount("");
    onSuccess?.(amount);
    setSubmitting(false);
    return true;
  };

  const handleQuickBid = (increment: number) => {
    setBidAmount(String((vehicle?.current_bid || 0) + increment));
  };

  return {
    bidAmount,
    setBidAmount,
    submitting,
    minBid,
    handlePlaceBid,
    handleQuickBid,
  };
};
