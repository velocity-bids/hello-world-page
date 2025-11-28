import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Clock, Gavel, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

export const ListingGrid = ({
  listings,
  title,
  description,
  emptyMessage,
  isPast = false,
}: ListingGridProps) => {
  if (listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const },
      ended: { label: "Ended", variant: "secondary" as const },
      sold: { label: "Sold", variant: "default" as const },
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.ended;
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    
    if (end <= now) {
      return "Ended";
    }
    
    return formatDistanceToNow(end, { addSuffix: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const statusBadge = getStatusBadge(listing.status);
            
            return (
              <Link
                key={listing.id}
                to={`/vehicles/${listing.id}`}
                className="group block"
              >
                <Card className="overflow-hidden h-full transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={`${listing.year} ${listing.make} ${listing.model}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    <Badge
                      variant={statusBadge.variant}
                      className="absolute top-3 right-3"
                    >
                      {statusBadge.label}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.year} {listing.make} {listing.model}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Gavel className="h-3.5 w-3.5" />
                          Current Bid
                        </span>
                        <span className="font-bold">
                          ${listing.current_bid.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {isPast ? "Ended" : "Time Left"}
                        </span>
                        <span className="text-muted-foreground">
                          {getTimeRemaining(listing.auction_end_time)}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          {listing.bid_count} bid{listing.bid_count !== 1 ? 's' : ''}
                        </span>
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
