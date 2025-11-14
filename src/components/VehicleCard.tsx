import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, Gauge, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface VehicleCardProps {
  id: string;
  title: string;
  year: number;
  mileage: number;
  currentBid: number;
  timeLeft: string;
  image: string;
  featured?: boolean;
}

const VehicleCard = ({
  id,
  title,
  year,
  mileage,
  currentBid,
  timeLeft,
  image,
  featured = false,
}: VehicleCardProps) => {
  const navigate = useNavigate();

  return (
    <Link to={`/vehicle/${id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-elevated">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {featured && (
            <Badge className="absolute left-4 top-4 bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg bg-background/95 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4 text-timer-warning" />
              <span className="font-medium">{timeLeft}</span>
            </div>
            <div className="text-sm font-medium flex items-center gap-2">
              <div>
                <span className="text-muted-foreground">Current Bid:</span>{" "}
                <span className="text-bid-active">
                  ${currentBid.toLocaleString()}
                </span>
              </div>

              {/* CTA: View Auction — stopPropagation to avoid the outer Link and navigate to auction details */}
              <Button
                type="button"
                className="px-2 py-1 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/auction/${id}`);
                }}
                aria-label={`View auction for ${title}`}
              >
                View Auction
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-semibold transition-colors group-hover:text-accent">
              {year} {title}
            </h3>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{year}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              <span>{mileage.toLocaleString()} mi</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
// ...existing code...
export default VehicleCard;
