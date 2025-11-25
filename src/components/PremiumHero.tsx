import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeaturedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url: string | null;
  current_bid: number | null;
  auction_end_time: string;
}

const PremiumHero = () => {
  const navigate = useNavigate();
  const [featuredVehicles, setFeaturedVehicles] = useState<FeaturedVehicle[]>([]);

  useEffect(() => {
    const fetchFeaturedVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, year, image_url, current_bid, auction_end_time")
        .eq("status", "active")
        .eq("approval_status", "approved")
        .order("current_bid", { ascending: false })
        .limit(8);

      if (!error && data) {
        setFeaturedVehicles(data);
      }
    };

    fetchFeaturedVehicles();
  }, []);

  const calculateTimeLeft = (endTime: string): string => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const distance = end - now;

    if (distance < 0) return "Ended";

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <section className="relative w-full bg-background">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-automotive-dark via-automotive-dark/95 to-automotive-dark/90 border-b border-border">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCA2YzAgLjU1Mi0uNDQ4IDEtMSAxcy0xLS40NDgtMS0xIC40NDgtMSAxLTEgMSAuNDQ4IDEgMXoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="container relative mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <Badge variant="secondary" className="inline-flex items-center gap-2 bg-accent/20 text-accent border-accent/30 backdrop-blur-sm px-4 py-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="font-semibold">Live Auctions</span>
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-automotive-light leading-tight">
              Premium Vehicles,{" "}
              <span className="bg-gradient-to-r from-accent via-accent/90 to-accent/70 bg-clip-text text-transparent">
                Transparent Auctions
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-automotive-light/80 font-light max-w-2xl mx-auto leading-relaxed">
              Discover exceptional vehicles from trusted sellers. Bid with confidence in our secure, fast-paced marketplace designed for automotive enthusiasts.
            </p>

            {/* CTA */}
            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/auctions")}
                className="gap-2 shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground px-8 h-12 text-base font-semibold"
              >
                Browse Auctions
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Listings Carousel */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Featured Vehicles
          </h2>
          <p className="text-muted-foreground">
            Top listings ending soon
          </p>
        </div>

        {featuredVehicles.length > 0 && (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {featuredVehicles.map((vehicle) => (
                <CarouselItem key={vehicle.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <Card
                    className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg border-border bg-card"
                    onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={vehicle.image_url || "/placeholder.svg"}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Countdown Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground border-border flex items-center gap-1.5 px-2.5 py-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs font-semibold">
                            {calculateTimeLeft(vehicle.auction_end_time)}
                          </span>
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Title */}
                      <div>
                        <h3 className="font-bold text-base text-foreground truncate">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline justify-between pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground font-medium">
                          Current Bid
                        </span>
                        <span className="text-xl font-bold text-accent">
                          ${(vehicle.current_bid || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default PremiumHero;
