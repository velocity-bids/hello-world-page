import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Clock, Gavel, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency, getVehicleTitle } from "@/lib/utils";

interface Listing {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url: string | null;
  current_bid: number;
  bid_count: number;
  auction_end_time: string;
  status: string;
}

interface ListingGridProps {
  listings: Listing[];
  title: string;
  description: string;
  emptyMessage: string;
  isPast?: boolean;
}

export const ListingGrid = ({ listings, title, description, emptyMessage, isPast = false }: ListingGridProps) => {
  const { t } = useTranslation();

  if (listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: t("translation:vehicle.active"), variant: "default" as const },
      ended: { label: t("translation:common.ended"), variant: "secondary" as const },
      sold: { label: t("translation:vehicle.sold"), variant: "default" as const },
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.ended;
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    if (end <= now) return t("translation:common.ended");
    return formatDistanceToNow(end, { addSuffix: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const statusBadge = getStatusBadge(listing.status);

            return (
              <Link key={listing.id} to={`/vehicles/${listing.id}`} className="group block">
                <Card className="h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt={getVehicleTitle(listing)} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}

                    <Badge variant={statusBadge.variant} className="absolute right-3 top-3">
                      {statusBadge.label}
                    </Badge>
                  </div>

                  <CardContent className="space-y-3 p-4">
                    <div>
                      <h3 className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
                        {getVehicleTitle(listing)}
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Gavel className="h-3.5 w-3.5" />
                          {t("translation:vehicle.currentBid")}
                        </span>
                        <span className="font-bold">{formatCurrency(listing.current_bid)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {isPast ? t("translation:common.ended") : t("translation:vehicle.timeLeft")}
                        </span>
                        <span className="text-muted-foreground">{getTimeRemaining(listing.auction_end_time)}</span>
                      </div>

                      <div className="border-t pt-2">
                        <span className="text-xs text-muted-foreground">{t("translation:bidding.bid", { count: listing.bid_count })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
