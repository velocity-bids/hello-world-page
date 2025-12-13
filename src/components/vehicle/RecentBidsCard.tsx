import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { Bid } from "@/types";

interface RecentBidsCardProps {
  bids: Bid[];
  onViewAll: () => void;
}

export const RecentBidsCard = ({ bids, onViewAll }: RecentBidsCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Bids</h2>
        {bids.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </div>
      {bids.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No bids yet</p>
      ) : (
        <div className="space-y-3">
          {bids.map((bid, index) => (
            <div key={bid.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/user/${bid.bidder_id}`}
                        className="truncate text-sm font-medium hover:text-accent transition-colors hover:underline block"
                      >
                        {bid.profiles?.display_name || "Anonymous"}
                      </Link>
                      {bid.profiles?.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(bid.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  {index === 0 && (
                    <Badge variant="outline" className="mb-1 bg-accent/10 text-xs">
                      High
                    </Badge>
                  )}
                  <span className="text-sm font-bold text-bid-active whitespace-nowrap">
                    ${bid.amount.toLocaleString()}
                  </span>
                </div>
              </div>
              {index < bids.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
