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
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-elevated">
      <Link to={`/vehicle/${id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
        </div>

        <div className="mx-4 mt-4 flex items-center justify-between rounded-lg border bg-card px-3 py-2">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-timer-warning" />
            <span className="font-medium">{timeLeft}</span>
          </div>
          <div className="text-sm font-medium">
            <span className="text-muted-foreground">Current Bid:</span>{" "}
            <span className="text-bid-active">
              ${currentBid.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4 pt-3">
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
      </Link>

      <div className="px-4 pb-4 pt-2">
        <Button
          onClick={(e) => {
            e.preventDefault();
            navigate(`/vehicle/${id}`);
          }}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 shadow-sm"
          aria-label={`View auction for ${title}`}
        >
          View Auction
        </Button>
      </div>
    </Card>
  );
};
export default VehicleCard;
