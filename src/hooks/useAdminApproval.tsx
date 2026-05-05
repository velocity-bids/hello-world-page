import { useState } from "react";
import { updateVehicleApprovalStatus } from "@/db/mutations";
import { toast } from "sonner";

interface UseAdminApprovalOptions {
  vehicleId: string | undefined;
  onStatusChange?: (status: string, notes: string) => void;
}

export const useAdminApproval = ({ vehicleId, onStatusChange }: UseAdminApprovalOptions) => {
  const [adminNotes, setAdminNotes] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const handleAdminAction = async (action: "approved" | "declined") => {
    if (!vehicleId) return;

    setAdminSubmitting(true);
    const { error } = await updateVehicleApprovalStatus(vehicleId, action, adminNotes || null);

    if (error) {
      toast.error(`Failed to ${action === "approved" ? "approve" : "decline"} listing`);
    } else {
      toast.success(`Listing ${action === "approved" ? "approved" : "declined"} successfully`);
      onStatusChange?.(action, adminNotes);
      setAdminNotes("");
    }
    setAdminSubmitting(false);
  };

  return {
    adminNotes,
    adminSubmitting,
    setAdminNotes,
    handleAdminAction,
  };
};
