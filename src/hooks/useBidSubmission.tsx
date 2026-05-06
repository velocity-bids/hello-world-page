import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.error(t("translation:bidding.pleaseSignInToBid"));
      return false;
    }

    if (!bidAmount || !vehicle) return false;

    const amount = parseFloat(bidAmount);

    if (amount < minBid) {
      toast.error(t("translation:bidding.minimumBidIs", { amount: formatCurrency(minBid) }));
      return false;
    }

    setSubmitting(true);

    const { data, error } = await supabase.rpc("place_bid", {
      p_vehicle_id: vehicle.id,
      p_amount: amount,
    });

    if (error) {
      toast.error(t("translation:bidding.bidPlacedFailed"));
      setSubmitting(false);
      return false;
    } else if (data && typeof data === "object" && "error" in data && data.error) {
      toast.error(String(data.error));
      setSubmitting(false);
      return false;
    }

    toast.success(t("translation:bidding.bidPlacedSuccess"));
    setBidAmount("translation:");
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
