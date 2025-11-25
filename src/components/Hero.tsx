import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-car.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Premium luxury sports car"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-automotive-dark/95 via-automotive-dark/80 to-automotive-dark/50" />
      </div>

      <div className="container relative mx-auto flex min-h-[85vh] items-center px-4 py-20">
        <div className="max-w-4xl space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-5 py-2.5 backdrop-blur-md animate-fade-in">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-accent">Live Auctions Now</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-6xl font-bold leading-[1.1] tracking-tight text-automotive-light sm:text-7xl lg:text-8xl">
              Find Your
              <span className="block bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
                Dream Vehicle
              </span>
            </h1>
            <p className="text-xl text-automotive-light/80 sm:text-2xl font-light max-w-2xl leading-relaxed">
              Join the premier marketplace where collectors and enthusiasts trade exceptional vehicles
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg" 
              onClick={() => navigate("/auctions")}
              className="gap-2 shadow-elegant text-lg h-14 px-8 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Explore Auctions
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/create-listing")}
              className="backdrop-blur-md bg-background/10 border-automotive-light/30 text-automotive-light hover:bg-background/20 hover:text-automotive-light hover:border-automotive-light/50 text-lg h-14 px-8"
            >
              Sell Your Car
            </Button>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-start gap-4 backdrop-blur-sm bg-background/5 p-6 rounded-xl border border-automotive-light/10">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-3xl font-bold text-automotive-light mb-1">$45M+</div>
                <div className="text-sm text-automotive-light/70 font-medium">Total Value Traded</div>
              </div>
            </div>

            <div className="flex items-start gap-4 backdrop-blur-sm bg-background/5 p-6 rounded-xl border border-automotive-light/10">
              <div className="p-2 rounded-lg bg-accent/10">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-3xl font-bold text-automotive-light mb-1">100%</div>
                <div className="text-sm text-automotive-light/70 font-medium">Verified Sellers</div>
              </div>
            </div>

            <div className="flex items-start gap-4 backdrop-blur-sm bg-background/5 p-6 rounded-xl border border-automotive-light/10">
              <div className="p-2 rounded-lg bg-accent/10">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-3xl font-bold text-automotive-light mb-1">2.5K+</div>
                <div className="text-sm text-automotive-light/70 font-medium">Vehicles Sold</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
