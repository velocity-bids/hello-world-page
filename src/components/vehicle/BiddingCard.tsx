import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Heart } from "lucide-react";

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
  const canBid = !isOwnListing && !isAdmin && isApproved;
  return (
    <Card className="p-6">
      <div className="mb-6 space-y-4">
        <div>
          <div className="text-sm text-muted-foreground">Current Bid</div>
          <div className="text-3xl font-bold text-bid-active">
            ${currentBid.toLocaleString()}
          </div>
          {bidCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {bidCount} {bidCount === 1 ? "bid" : "bids"}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-muted p-4">
          <div className="mb-2 flex items-center gap-2 text-timer-warning">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">
              {isEnded ? "Auction Ended" : "Ends In"}
            </span>
          </div>
          <div className="text-2xl font-bold">{timeLeft}</div>
        </div>

        {reservePrice && (
          <div>
            <div className="text-sm text-muted-foreground">Reserve Status</div>
            <div
              className={`font-medium ${
                reserveMet ? "text-bid-active" : "text-muted-foreground"
              }`}
            >
              {reserveMet ? "Reserve Met" : "Reserve Not Met"}
            </div>
          </div>
        )}
      </div>

      {isActive && !isEnded && (
        <div className="space-y-3">
          {!canBid ? (
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              {isOwnListing
                ? "You cannot bid on your own listing"
                : isAdmin
                ? "Administrators cannot place bids"
                : "This vehicle is pending approval"}
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder={`Min: $${minBid.toLocaleString()}`}
                  type="number"
                  value={bidAmount}
                  onChange={(e) => onBidAmountChange(e.target.value)}
                  min={minBid}
                  step="100"
                />
                <Button onClick={onPlaceBid} disabled={submitting}>
                  {submitting ? "Placing..." : "Bid"}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickBid(100)}
                >
                  +$100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickBid(500)}
                >
                  +$500
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickBid(1000)}
                >
                  +$1000
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Minimum bid: ${minBid.toLocaleString()}
              </p>
            </>
          )}
          <Button
            variant={watching ? "default" : "outline"}
            className="w-full"
            onClick={onWatchToggle}
            disabled={watchLoading}
          >
            <Heart className={`h-4 w-4 mr-2 ${watching ? "fill-current" : ""}`} />
            {watchLoading ? "Loading..." : watching ? "Watching" : "Watch Auction"}
          </Button>
        </div>
      )}
    </Card>
  );
};
