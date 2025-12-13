/**
 * MOCK ID VERIFICATION CONTEXT
 * 
 * This is a TEMPORARY mock implementation for ID verification.
 * The verification is client-side only and expires after 10 seconds.
 * 
 * TODO: Replace with real backend verification when ready:
 * - Integrate with a real ID verification service (e.g., Stripe Identity, Jumio)
 * - Store verification status in the database
 * - Remove the expiration timer
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface IdVerificationContextType {
  /** Whether the user is currently verified (mock - expires after 10 seconds) */
  isVerified: boolean;
  /** Whether verification is in progress */
  isVerifying: boolean;
  /** Time remaining until verification expires (in seconds) */
  timeRemaining: number;
  /** Trigger the mock verification process */
  startVerification: () => void;
  /** Reset verification state (for testing) */
  resetVerification: () => void;
}

const IdVerificationContext = createContext<IdVerificationContextType | undefined>(undefined);

/** Duration of mock verification in seconds */
const VERIFICATION_DURATION_SECONDS = 10;

/** Simulated verification processing time in ms */
const MOCK_PROCESSING_TIME_MS = 1500;

export function IdVerificationProvider({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const expirationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (expirationTimerRef.current) {
        clearTimeout(expirationTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startVerification = useCallback(() => {
    // Clear any existing timers
    if (expirationTimerRef.current) {
      clearTimeout(expirationTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setIsVerifying(true);

    // Simulate processing time
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      setTimeRemaining(VERIFICATION_DURATION_SECONDS);

      // Start countdown timer for UI feedback
      countdownIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set expiration timer
      expirationTimerRef.current = setTimeout(() => {
        setIsVerified(false);
        setTimeRemaining(0);
      }, VERIFICATION_DURATION_SECONDS * 1000);
    }, MOCK_PROCESSING_TIME_MS);
  }, []);

  const resetVerification = useCallback(() => {
    if (expirationTimerRef.current) {
      clearTimeout(expirationTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsVerified(false);
    setIsVerifying(false);
    setTimeRemaining(0);
  }, []);

  return (
    <IdVerificationContext.Provider
      value={{
        isVerified,
        isVerifying,
        timeRemaining,
        startVerification,
        resetVerification,
      }}
    >
      {children}
    </IdVerificationContext.Provider>
  );
}

export function useIdVerification() {
  const context = useContext(IdVerificationContext);
  if (context === undefined) {
    throw new Error("useIdVerification must be used within an IdVerificationProvider");
  }
  return context;
}
