import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VehicleCardBase } from "@/components/common";
import { formatDistanceToNow } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import { ArrowUpRight, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BidWithVehicle } from "@/types";
import { formatCurrency, getVehicleTitle } from "@/lib/utils";

interface BidCardProps {
  bid: BidWithVehicle;
}

export const BidCard = ({ bid }: BidCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isWinning = bid.amount === bid.vehicle.current_bid;
  const isAuctionEnded = new Date(bid.vehicle.auction_end_time) < new Date();
  const timeLocale = i18n.language.startsWith("pt") ? pt : enGB;
  const timeLeft = formatDistanceToNow(new Date(bid.vehicle.auction_end_time), {
    addSuffix: true,
    locale: timeLocale,
  });

  const displayTitle = getVehicleTitle(bid.vehicle);

  const getStatusBadge = () => {
    if (isAuctionEnded) {
      return isWinning ? (
        <Badge className="border-0 bg-bid-active text-bid-active-foreground">{t("translation:bidding.won")}</Badge>
      ) : (
        <Badge variant="secondary">{t("translation:bidding.lost")}</Badge>
      );
    }

    return isWinning ? (
      <Badge className="border-0 bg-bid-active text-bid-active-foreground">{t("translation:bidding.leading")}</Badge>
    ) : (
      <Badge variant="destructive">{t("translation:bidding.outbid")}</Badge>
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
            <Eye className="mr-2 h-4 w-4" />
            {t("translation:vehicle.viewAuction")}
          </Button>
          {!isAuctionEnded && !isWinning && (
            <Button onClick={() => navigate(`/vehicle/${bid.vehicle.id}`)} variant="outline" className="flex-1">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {t("translation:bidding.increaseBid")}
            </Button>
          )}
        </div>
      }
    >
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="mb-1 text-xl font-bold text-foreground">{displayTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {t("translation:bidding.bidPlaced", {
                time: formatDistanceToNow(new Date(bid.created_at), { addSuffix: true, locale: timeLocale }),
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-y border-border py-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{t("translation:bidding.yourBid")}</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(bid.amount)}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              {isAuctionEnded ? t("translation:vehicle.finalPrice") : t("translation:vehicle.currentBid")}
            </p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(bid.vehicle.current_bid)}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              {isAuctionEnded ? t("translation:common.ended") : t("translation:vehicle.timeLeft")}
            </p>
            <p className={`text-lg font-bold ${isAuctionEnded ? "text-muted-foreground" : "text-foreground"}`}>
              {isAuctionEnded ? t("translation:bidding.closed") : timeLeft}
            </p>
          </div>
        </div>
      </div>
    </VehicleCardBase>
  );
};
