import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { getAllBidsForVehicle, enrichWithProfiles } from "@/db/queries";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { Bid } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface BidHistoryModalProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BidHistoryModal = ({ vehicleId, isOpen, onClose }: BidHistoryModalProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("pt") ? "pt-PT" : "en-GB";

  useEffect(() => {
    if (!isOpen || !vehicleId) return;

    let cancelled = false;

    const fetchAllBids = async () => {
      setLoading(true);
      const { data, error } = await getAllBidsForVehicle(vehicleId);

      if (cancelled) return;

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching bids:", error);
        }
        toast.error(t("translation:bidding.failedLoadBidHistory"));
        setLoading(false);
        return;
      }

      const bidsWithProfiles = await enrichWithProfiles(data, (bid) => bid.bidder_id);
      if (!cancelled) {
        setBids(bidsWithProfiles);
        setLoading(false);
      }
    };

    fetchAllBids();
    return () => {
      cancelled = true;
    };
  }, [isOpen, vehicleId, t]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("translation:bidding.fullBidHistory")}</DialogTitle>
          <DialogDescription>{t("translation:bidding.fullBidHistoryDescription")}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : bids.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{t("translation:bidding.noBidsYet")}</div>
          ) : (
            <div className="space-y-3">
              {bids.map((bid, index) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/user/${bid.bidder_id}`}
                          className="truncate font-medium transition-colors hover:text-accent hover:underline"
                        >
                          {bid.profiles?.display_name || t("translation:common.anonymous")}
                        </Link>
                        {bid.profiles?.verified && <VerifiedBadge size="sm" />}
                        {index === 0 && (
                          <Badge variant="outline" className="bg-accent/10">
                            {t("translation:bidding.highest")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{new Date(bid.created_at).toLocaleString(locale)}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xl font-bold text-bid-active">{formatCurrency(bid.amount)}</div>
                    <div className="text-xs text-muted-foreground">{t("translation:bidding.bidNumber", { count: bids.length - index })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
