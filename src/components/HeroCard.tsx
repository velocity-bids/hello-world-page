import { VehicleCardBase } from "@/components/common";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { MapPin, Gauge, Cog } from "lucide-react";

interface HeroCardProps {
  id: string;
  image: string;
  year: number;
  make: string;
  model: string;
  subtitle?: string;
  mileage: number;
  transmission: string;
  location: string;
}

const HeroCard = ({
  id,
  image,
  year,
  make,
  model,
  subtitle,
  mileage,
  transmission,
  location,
}: HeroCardProps) => {
  const displayTitle = `${year} ${make} ${model}`;

  return (
    <VehicleCardBase
      id={id}
      image={image}
      title={displayTitle}
      aspectRatio="16/9"
      className="bg-card border border-border rounded-xl max-w-4xl mx-auto"
      ctaText="View Listing"
    >
      {/* Content Area */}
      <div className="p-6 space-y-4">
        {/* Title Section */}
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {displayTitle}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Key Stats Row */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="font-medium">{mileage.toLocaleString()} mi</span>
          </div>
          <div className="flex items-center gap-2">
            <Cog className="h-4 w-4 text-primary" />
            <span className="font-medium">{transmission}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">{location}</span>
          </div>
        </div>
      </div>
    </VehicleCardBase>
  );
};

export default HeroCard;
