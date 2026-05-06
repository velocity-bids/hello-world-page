import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Heart, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BiddingCardProps {
  currentBid: number;
  bidCount: number;
  timeLeft: string;
  isEnded: boolean;
  reservePrice?: number | null;
  reserveMet: boolean;
  isOwnListing: boolean;
  isAdmin?: boolean;
  isApproved?: boolean;
  bidAmount: string;
  onBidAmountChange: (value: string) => void;
  onPlaceBid: () => void;
  onQuickBid: (increment: number) => void;
  onWatchToggle: () => void;
  submitting: boolean;
  watching: boolean;
  watchLoading: boolean;
  minBid: number;
  isActive: boolean;
}

export const BiddingCard = ({
  currentBid,
  bidCount,
  timeLeft,
  isEnded,
  reservePrice,
  reserveMet,
  isOwnListing,
  isAdmin = false,
  isApproved = true,
  bidAmount,
  onBidAmountChange,
  onPlaceBid,
  onQuickBid,
  onWatchToggle,
  submitting,
  watching,
  watchLoading,
  minBid,
  isActive,
}: BiddingCardProps) => {
  const { t } = useTranslation();
  const canBid = !isOwnListing && !isAdmin && isApproved;

  return (
    <Card className="p-6">
      <div className="mb-6 space-y-4">
        <div>
          {isEnded ? (
            <>
              {bidCount === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-5 w-5" />
                  <span className="text-lg font-semibold">{t("translation:bidding.noBids")}</span>
                </div>
              ) : reserveMet ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-lg font-semibold">{t("translation:vehicle.sold")}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="text-lg font-semibold">{t("translation:vehicle.reserveNotMet")}</span>
                </div>
              )}
              <div className="mt-1 text-3xl font-bold text-foreground">{formatCurrency(currentBid)}</div>
              <div className="text-sm text-muted-foreground">{t("translation:bidding.finalPriceWithCount", { count: bidCount })}</div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">{t("translation:vehicle.currentBid")}</div>
              <div className="text-3xl font-bold text-bid-active">{formatCurrency(currentBid)}</div>
              {bidCount > 0 && <div className="text-sm text-muted-foreground">{t("translation:bidding.bid", { count: bidCount })}</div>}
            </>
          )}
        </div>

        <div className="rounded-lg bg-muted p-4">
          <div className="mb-2 flex items-center gap-2 text-timer-warning">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">{isEnded ? t("translation:bidding.auctionEnded") : t("translation:bidding.endsIn")}</span>
          </div>
          <div className="text-2xl font-bold">{timeLeft}</div>
        </div>

        {!isEnded && reservePrice && (
          <div>
            <div className="text-sm text-muted-foreground">{t("translation:bidding.reserveStatus")}</div>
            <div className={`font-medium ${reserveMet ? "text-bid-active" : "text-muted-foreground"}`}>
              {reserveMet ? t("translation:vehicle.reserveMet") : t("translation:vehicle.reserveNotMet")}
            </div>
          </div>
        )}
      </div>

      {isActive && !isEnded && (
        <div className="space-y-3">
          {!canBid ? (
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              {isOwnListing
                ? t("translation:bidding.cannotBidOwn")
                : isAdmin
                ? t("translation:bidding.adminsCannotBid")
                : t("translation:bidding.pendingApproval")}
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder={t("translation:bidding.minimumBid", { amount: formatCurrency(minBid) })}
                  type="number"
                  value={bidAmount}
                  onChange={(e) => onBidAmountChange(e.target.value)}
                  min={minBid}
                  step="100"
                />
                <Button onClick={onPlaceBid} disabled={submitting}>
                  {submitting ? t("translation:bidding.placing") : t("translation:bidding.placeBid")}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((increment) => (
                  <Button key={increment} variant="outline" size="sm" onClick={() => onQuickBid(increment)}>
                    {t("translation:bidding.quickBidIncrement", { amount: formatCurrency(increment) })}
                  </Button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">{t("translation:bidding.minimumBid", { amount: formatCurrency(minBid) })}</p>
            </>
          )}
        </div>
      )}

      <div className="mt-3">
        <Button variant={watching ? "default" : "outline"} className="w-full" onClick={onWatchToggle} disabled={watchLoading}>
          <Heart className={`mr-2 h-4 w-4 ${watching ? "fill-current" : ""}`} />
          {watchLoading ? t("translation:bidding.loadingWatch") : watching ? t("translation:vehicle.watching") : t("translation:vehicle.watch")}
        </Button>
      </div>
    </Card>
  );
};
