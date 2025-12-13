import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gauge, Heart } from "lucide-react";

interface VehicleInfoProps {
  year: number;
  make: string;
  model: string;
  mileage: number;
  vin?: string | null;
  isActive: boolean;
}

export const VehicleInfo = ({
  year,
  make,
  model,
  mileage,
  vin,
  isActive,
}: VehicleInfoProps) => {
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          {isActive && (
            <Badge className="mb-2 bg-accent">Live Auction</Badge>
          )}
          <h1 className="text-3xl font-bold">
            {year} {make} {model}
          </h1>
        </div>
        <Button variant="ghost" size="icon">
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>{year}</span>
        </div>
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          <span>{mileage.toLocaleString()} miles</span>
        </div>
        {vin && (
          <div className="flex items-center gap-2">
            <span className="text-sm">VIN: {vin}</span>
          </div>
        )}
      </div>
    </div>
  );
};
