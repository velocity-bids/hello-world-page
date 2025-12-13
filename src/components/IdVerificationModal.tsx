/**
 * MOCK ID VERIFICATION MODAL
 * 
 * This is a TEMPORARY mock implementation.
 * No real file upload or backend verification occurs.
 * 
 * TODO: Replace with real implementation when ready.
 */

import { useState } from "react";
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
  const { isVerifying, isVerified, startVerification, timeRemaining } = useIdVerification();
  const [mockFileSelected, setMockFileSelected] = useState(false);

  const handleMockFileSelect = () => {
    // Mock file selection - no real file handling
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
            ID Verification Required
          </DialogTitle>
          <DialogDescription>
            To create an auction, you need to verify your identity. Upload a valid ID document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mock warning notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Demo Mode:</strong> This is a mock verification. Verification expires after 10 seconds.
            </p>
          </div>

          {isVerified ? (
            // Verified state
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Verification Successful!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can now create auctions.
                </p>
                {timeRemaining > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Expires in {timeRemaining} seconds (demo only)
                  </p>
                )}
              </div>
              <Button onClick={handleClose} className="mt-2">
                Continue to Create Auction
              </Button>
            </div>
          ) : isVerifying ? (
            // Verifying state
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your ID...</p>
            </div>
          ) : (
            // Upload state
            <>
              {/* Mock file upload area */}
              <button
                type="button"
                onClick={handleMockFileSelect}
                className={cn(
                  "w-full border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
                  "hover:border-primary hover:bg-primary/5",
                  mockFileSelected
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-muted-foreground/25"
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  {mockFileSelected ? (
                    <>
                      <FileCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        mock_id_document.pdf
                      </p>
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload ID</p>
                      <p className="text-xs text-muted-foreground">
                        Passport, Driver's License, or National ID
                      </p>
                    </>
                  )}
                </div>
              </button>

              {/* Verify button */}
              <Button
                onClick={handleVerify}
                disabled={!mockFileSelected}
                className="w-full"
              >
                Verify Identity
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By verifying, you confirm that the ID belongs to you and is valid.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
