import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Eye } from "lucide-react";

interface BidCardProps {
  bid: {
    id: string;
    amount: number;
    created_at: string;
    vehicle: {
      id: string;
      make: string;
      model: string;
      year: number;
      image_url: string | null;
      current_bid: number;
      auction_end_time: string;
      status: string;
    };
  };
}

export const BidCard = ({ bid }: BidCardProps) => {
  const navigate = useNavigate();
  
  const isWinning = bid.amount === bid.vehicle.current_bid;
  const isAuctionEnded = new Date(bid.vehicle.auction_end_time) < new Date();
  const timeLeft = formatDistanceToNow(new Date(bid.vehicle.auction_end_time), {
    addSuffix: true,
  });
  
  const getStatusBadge = () => {
    if (isAuctionEnded) {
      if (isWinning) {
        return (
          <Badge className="bg-bid-active text-bid-active-foreground border-0">
            Won
          </Badge>
        );
      }
      return <Badge variant="secondary">Lost</Badge>;
    }
    
    if (isWinning) {
      return (
        <Badge className="bg-bid-active text-bid-active-foreground border-0">
          Leading
        </Badge>
      );
    }
    
    return <Badge variant="destructive">Outbid</Badge>;
  };

  return (
    <Card className="overflow-hidden hover:shadow-elevated transition-shadow duration-300 group">
      <div className="grid md:grid-cols-[280px_1fr] gap-0">
        {/* Image */}
        <div className="relative aspect-[4/3] md:aspect-square overflow-hidden bg-muted">
          <img
            src={bid.vehicle.image_url || "/placeholder.svg"}
            alt={`${bid.vehicle.year} ${bid.vehicle.make} ${bid.vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {bid.vehicle.year} {bid.vehicle.make} {bid.vehicle.model}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bid placed {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Bid Info Grid */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Your Bid
                </p>
                <p className="text-lg font-bold text-foreground">
                  ${bid.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Current Bid
                </p>
                <p className="text-lg font-bold text-foreground">
                  ${bid.vehicle.current_bid.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {isAuctionEnded ? "Ended" : "Time Left"}
                </p>
                <p className={`text-lg font-bold ${
                  isAuctionEnded 
                    ? "text-muted-foreground" 
                    : "text-foreground"
                }`}>
                  {isAuctionEnded ? "Closed" : timeLeft}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => navigate(`/vehicle/${bid.vehicle.id}`)}
              variant="default"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Auction
            </Button>
            {!isAuctionEnded && !isWinning && (
              <Button
                onClick={() => navigate(`/vehicle/${bid.vehicle.id}`)}
                variant="outline"
                className="flex-1"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Increase Bid
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
