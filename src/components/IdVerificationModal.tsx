/**
 * MOCK ID VERIFICATION MODAL
 *
 * This is a TEMPORARY mock implementation.
 * No real file upload or backend verification occurs.
 *
 * TODO: Replace with real implementation when ready.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIdVerification } from "@/contexts/IdVerificationContext";
import { Upload, CheckCircle, Loader2, FileCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdVerificationModal({ open, onOpenChange }: IdVerificationModalProps) {
  const { t } = useTranslation();
  const { isVerifying, isVerified, startVerification, timeRemaining } = useIdVerification();
  const [mockFileSelected, setMockFileSelected] = useState(false);

  const handleMockFileSelect = () => {
    setMockFileSelected(true);
  };

  const handleVerify = () => {
    startVerification();
  };

  const handleClose = () => {
    setMockFileSelected(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("translation:auth.idVerificationRequired")}
          </DialogTitle>
          <DialogDescription>{t("translation:translation:auth.idVerificationDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>{t("translation:auth.demoMode")}</strong> {t("translation:auth.demoModeDescription")}
            </p>
          </div>

          {isVerified ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-green-700 dark:text-green-400">{t("translation:auth.verificationSuccessful")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("translation:auth.canCreateAuctions")}</p>
                {timeRemaining > 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{t("translation:auth.expiresInDemo", { count: timeRemaining })}</p>
                )}
              </div>
              <Button onClick={handleClose} className="mt-2">
                {t("translation:auth.continueToCreateAuction")}
              </Button>
            </div>
          ) : isVerifying ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("translation:auth.verifyingId")}</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleMockFileSelect}
                className={cn(
                  "w-full cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  mockFileSelected ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-muted-foreground/25"
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  {mockFileSelected ? (
                    <>
                      <FileCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">{t("translation:auth.mockIdDocument")}</p>
                      <p className="text-xs text-muted-foreground">{t("translation:auth.clickToChange")}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-medium">{t("translation:auth.clickToUploadId")}</p>
                      <p className="text-xs text-muted-foreground">{t("translation:auth.acceptedIdDocuments")}</p>
                    </>
                  )}
                </div>
              </button>

              <Button onClick={handleVerify} disabled={!mockFileSelected} className="w-full">
                {t("translation:auth.verifyIdentity")}
              </Button>

              <p className="text-center text-xs text-muted-foreground">{t("translation:auth.verificationConsent")}</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
