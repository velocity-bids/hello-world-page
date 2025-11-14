import { Button } from "@/components/ui/button";
import { ArrowRight, Gavel } from "lucide-react";
import heroImage from "@/assets/hero-car.jpg";
import HeroCard from "./HeroCard";
import carImage from "@/assets/car-1.jpg";

const Hero = () => {
  return (
    <>
      <section className="relative h-[30vh] min-h-[320px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Luxury sports car"
            className="h-full w-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-automotive-dark/98 via-automotive-dark/85 to-automotive-dark/40" />
        </div>

        <div className="container relative mx-auto flex h-full items-center px-4">
          <div className="flex w-full max-w-5xl items-center justify-between gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent/10 px-4 py-2 backdrop-blur-md">
                <Gavel className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-accent">Live Auctions</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl font-bold leading-tight tracking-tight text-automotive-light sm:text-6xl lg:text-7xl drop-shadow-lg">
                  Premium Car Auctions
                </h1>
                <p className="text-lg text-automotive-light/90 sm:text-xl font-medium max-w-xl">
                  Where enthusiasts buy and sell dream vehicles
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button size="lg" className="gap-2 shadow-elevated text-base h-12 px-6">
                  Browse Auctions
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="backdrop-blur-md bg-background/10 border-automotive-light/30 text-automotive-light hover:bg-background/20 hover:text-automotive-light text-base h-12 px-6">
                  List Your Vehicle
                </Button>
              </div>
            </div>

            <div className="hidden items-center gap-10 lg:flex">
              <div className="text-center backdrop-blur-sm bg-background/5 px-6 py-4 rounded-lg border border-automotive-light/10">
                <div className="text-4xl font-bold text-automotive-light">2.5K+</div>
                <div className="text-sm text-automotive-light/70 font-medium">Sold</div>
              </div>
              <div className="h-16 w-px bg-automotive-light/20" />
              <div className="text-center backdrop-blur-sm bg-background/5 px-6 py-4 rounded-lg border border-automotive-light/10">
                <div className="text-4xl font-bold text-automotive-light">$45M+</div>
                <div className="text-sm text-automotive-light/70 font-medium">Value</div>
              </div>
              <div className="h-16 w-px bg-automotive-light/20" />
              <div className="text-center backdrop-blur-sm bg-background/5 px-6 py-4 rounded-lg border border-automotive-light/10">
                <div className="text-4xl font-bold text-automotive-light">15K+</div>
                <div className="text-sm text-automotive-light/70 font-medium">Members</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <HeroCard
          id="featured-1"
          image={carImage}
          year={2021}
          make="Porsche"
          model="911 Turbo S"
          subtitle="Coupe · 640 HP"
          mileage={12500}
          transmission="8-Speed PDK"
          location="Los Angeles, CA"
        />
      </section>
    </>
  );
};

export default Hero;
