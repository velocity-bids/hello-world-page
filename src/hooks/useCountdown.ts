import { useState, useEffect, useCallback } from "react";

interface CountdownResult {
  timeLeft: string;
  isEnded: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useCountdown = (endTime: string | Date | null): CountdownResult => {
  const [countdown, setCountdown] = useState<CountdownResult>({
    timeLeft: "",
    isEnded: false,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const calculateTimeLeft = useCallback(() => {
    if (!endTime) {
      return {
        timeLeft: "",
        isEnded: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return {
        timeLeft: "Auction Ended",
        isEnded: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      timeLeft: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      isEnded: false,
      days,
      hours,
      minutes,
      seconds,
    };
  }, [endTime]);

  useEffect(() => {
    if (!endTime) return;

    setCountdown(calculateTimeLeft());
    const interval = setInterval(() => {
      setCountdown(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, calculateTimeLeft]);

  return countdown;
};

// Utility function for non-hook contexts
export const formatTimeRemaining = (endTime: string): string => {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
