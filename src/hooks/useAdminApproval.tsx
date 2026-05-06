import { useState } from "react";
import { useTranslation } from "react-i18next";
import { updateVehicleApprovalStatus } from "@/db/mutations";
import { toast } from "sonner";

interface UseAdminApprovalOptions {
  vehicleId: string | undefined;
  onStatusChange?: (status: string, notes: string) => void;
}

export const useAdminApproval = ({ vehicleId, onStatusChange }: UseAdminApprovalOptions) => {
  const { t } = useTranslation();
  const [adminNotes, setAdminNotes] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const handleAdminAction = async (action: "approved" | "declined") => {
    if (!vehicleId) return;

    setAdminSubmitting(true);
    const { error } = await updateVehicleApprovalStatus(vehicleId, action, adminNotes || null);

    if (error) {
      toast.error(t(action === "approved" ? "admin.approveFailed" : "admin.declineFailed"));
    } else {
      toast.success(t(action === "approved" ? "admin.listingApproved" : "admin.listingDeclined"));
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
