import { Badge } from "@/components/ui/badge";
import { VehicleCardBase } from "@/components/common";
import { Clock, Gauge, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

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
  const displayTitle = `${year} ${title}`;

  return (
    <VehicleCardBase
      id={id}
      image={`${image}-/resize/322x/`}
      title={displayTitle}
      badge={
        featured ? (
          <Badge className="bg-accent text-accent-foreground">Featured</Badge>
        ) : undefined
      }
      ctaText="View Auction"
    >
      <Link to={`/vehicle/${id}`} className="block">
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
              {displayTitle}
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
    </VehicleCardBase>
  );
};

export default VehicleCard;
