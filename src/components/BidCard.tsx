import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VehicleCardBase } from "@/components/common";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Eye } from "lucide-react";
import type { BidWithVehicle } from "@/types";

interface BidCardProps {
  bid: BidWithVehicle;
}

export const BidCard = ({ bid }: BidCardProps) => {
  const navigate = useNavigate();
  
  const isWinning = bid.amount === bid.vehicle.current_bid;
  const isAuctionEnded = new Date(bid.vehicle.auction_end_time) < new Date();
  const timeLeft = formatDistanceToNow(new Date(bid.vehicle.auction_end_time), {
    addSuffix: true,
  });

  const displayTitle = `${bid.vehicle.year} ${bid.vehicle.make} ${bid.vehicle.model}`;
  
  const getStatusBadge = () => {
    if (isAuctionEnded) {
      return isWinning ? (
        <Badge className="bg-bid-active text-bid-active-foreground border-0">Won</Badge>
      ) : (
        <Badge variant="secondary">Lost</Badge>
      );
    }
    
    return isWinning ? (
      <Badge className="bg-bid-active text-bid-active-foreground border-0">Leading</Badge>
    ) : (
      <Badge variant="destructive">Outbid</Badge>
    );
  };

  return (
    <VehicleCardBase
      id={bid.vehicle.id}
      image={bid.vehicle.image_url || "/placeholder.svg"}
      title={displayTitle}
      horizontal
      showCta={false}
      overlay={getStatusBadge()}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => navigate(`/vehicle/${bid.vehicle.id}`)} variant="default" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View Auction
          </Button>
          {!isAuctionEnded && !isWinning && (
            <Button onClick={() => navigate(`/vehicle/${bid.vehicle.id}`)} variant="outline" className="flex-1">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Increase Bid
            </Button>
          )}
        </div>
      }
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">
              {displayTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              Bid placed {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Bid</p>
            <p className="text-lg font-bold text-foreground">${bid.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Bid</p>
            <p className="text-lg font-bold text-foreground">${bid.vehicle.current_bid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {isAuctionEnded ? "Ended" : "Time Left"}
            </p>
            <p className={`text-lg font-bold ${isAuctionEnded ? "text-muted-foreground" : "text-foreground"}`}>
              {isAuctionEnded ? "Closed" : timeLeft}
            </p>
          </div>
        </div>
      </div>
    </VehicleCardBase>
  );
};
