import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";
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
import heroImage from "@/assets/hero-car.jpg";

interface FeaturedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url: string | null;
  current_bid: number | null;
}

const Hero = () => {
  const navigate = useNavigate();
  const [featuredVehicles, setFeaturedVehicles] = useState<FeaturedVehicle[]>([]);

  useEffect(() => {
    const fetchFeaturedVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, year, image_url, current_bid")
        .eq("status", "active")
        .eq("approval_status", "approved")
        .order("current_bid", { ascending: false })
        .limit(6);

      if (!error && data) {
        setFeaturedVehicles(data);
      }
    };

    fetchFeaturedVehicles();
  }, []);

  return (
    <section className="relative h-[25vh] min-h-[200px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Premium luxury sports car"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-automotive-dark/95 via-automotive-dark/80 to-automotive-dark/50" />
      </div>

      <div className="container relative mx-auto flex h-[25vh] min-h-[200px] items-center px-4 py-6">
        <div className="max-w-6xl space-y-4">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1 space-y-3">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 backdrop-blur-md animate-fade-in">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="text-xs font-semibold text-accent">Live Auctions Now</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-automotive-light sm:text-4xl">
                  Find Your
                  <span className="block bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
                    Dream Vehicle
                  </span>
                </h1>
                <p className="text-sm text-automotive-light/80 sm:text-base font-light max-w-xl">
                  Join the premier marketplace where collectors and enthusiasts trade exceptional vehicles
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <Button 
                  size="sm"
                  onClick={() => navigate("/auctions")}
                  className="gap-2 shadow-elegant bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Explore Auctions
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={() => navigate("/create-listing")}
                  className="backdrop-blur-md bg-background/10 border-automotive-light/30 text-automotive-light hover:bg-background/20 hover:text-automotive-light hover:border-automotive-light/50"
                >
                  Sell Your Car
                </Button>
              </div>
            </div>

            {/* Value Props - Horizontal on larger screens */}
            <div className="hidden lg:flex items-center gap-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-3 backdrop-blur-sm bg-background/5 p-3 rounded-lg border border-automotive-light/10">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="text-xl font-bold text-automotive-light">$45M+</div>
                  <div className="text-xs text-automotive-light/70 font-medium">Value Traded</div>
                </div>
              </div>

              <div className="flex items-center gap-3 backdrop-blur-sm bg-background/5 p-3 rounded-lg border border-automotive-light/10">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <Shield className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="text-xl font-bold text-automotive-light">100%</div>
                  <div className="text-xs text-automotive-light/70 font-medium">Verified</div>
                </div>
              </div>

              <div className="flex items-center gap-3 backdrop-blur-sm bg-background/5 p-3 rounded-lg border border-automotive-light/10">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="text-xl font-bold text-automotive-light">2.5K+</div>
                  <div className="text-xs text-automotive-light/70 font-medium">Sold</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
