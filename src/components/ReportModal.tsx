import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createReport } from "@/db/mutations";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const REPORT_REASONS = ["fraudulent", "inappropriate", "duplicate", "misleading", "other"] as const;

interface ReportModalProps {
  vehicleId: string;
  vehicleTitle: string;
}

export function ReportModal({ vehicleId, vehicleTitle }: ReportModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t("translation:report.mustLogin"));
      return;
    }

    if (!reason) {
      toast.error(t("translation:report.selectReasonError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createReport({
        reporter_id: user.id,
        vehicle_id: vehicleId,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success(t("translation:report.submitted"));
      setOpen(false);
      setReason("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(t("translation:report.submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setReason("");
        setDescription("");
      }
      setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Flag className="h-4 w-4" />
          {t("translation:report.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("translation:report.title")}</DialogTitle>
          <DialogDescription>{t("translation:report.description", { title: vehicleTitle })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">{t("translation:report.reason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder={t("translation:report.selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`report.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t("translation:report.additionalDetails")}</Label>
            <Textarea id="description" placeholder={t("translation:report.additionalDetailsPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("translation:common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting ? t("translation:feedback.submitting") : t("translation:report.submitReport")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
