import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { Bid } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface RecentBidsCardProps {
  bids: Bid[];
  onViewAll: () => void;
}

export const RecentBidsCard = ({ bids, onViewAll }: RecentBidsCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("translation:bidding.recentBids")}</h2>
        {bids.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            {t("translation:bidding.viewAll")}
          </Button>
        )}
      </div>
      {bids.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("translation:bidding.noBidsYet")}</p>
      ) : (
        <div className="space-y-3">
          {bids.map((bid, index) => (
            <div key={bid.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <Link to={`/user/${bid.bidder_id}`} className="block truncate text-sm font-medium transition-colors hover:text-accent hover:underline">
                        {bid.profiles?.display_name || t("translation:common.anonymous")}
                      </Link>
                      {bid.profiles?.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(bid.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end">
                  {index === 0 && (
                    <Badge variant="outline" className="mb-1 bg-accent/10 text-xs">
                      {t("translation:bidding.high")}
                    </Badge>
                  )}
                  <span className="whitespace-nowrap text-sm font-bold text-bid-active">{formatCurrency(bid.amount)}</span>
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
