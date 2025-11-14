import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { MapPin, Gauge, Cog } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-elevated bg-card border border-border rounded-xl max-w-4xl mx-auto">
      {/* Image Area - 16:9 */}
      <div className="relative overflow-hidden bg-muted">
        <AspectRatio ratio={16 / 9}>
          <img
            src={image}
            alt={`${year} ${make} ${model}`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </AspectRatio>
      </div>

      {/* Content Area */}
      <div className="p-6 space-y-4">
        {/* Title Section */}
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {year} {make} {model}
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

        {/* CTA Button */}
        <Button
          onClick={() => navigate(`/vehicle/${id}`)}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-sm transition-all duration-300"
          aria-label={`View listing for ${year} ${make} ${model}`}
        >
          View Listing
        </Button>
      </div>
    </Card>
  );
};

export default HeroCard;
