import VehicleCard from "./VehicleCard";
import { useVehicles } from "@/hooks/useVehicles";
import { Skeleton } from "./ui/skeleton";

const FeaturedAuctions = () => {
  const { vehicles, loading } = useVehicles();

  const calculateTimeLeft = (auctionEndTime: string) => {
    const end = new Date(auctionEndTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const featuredVehicles = vehicles.slice(0, 4);

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">Featured Auctions</h2>
          <p className="mt-2 text-muted-foreground">
            Curated collection of exceptional vehicles available now
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : featuredVehicles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              id={vehicle.id}
              title={`${vehicle.make} ${vehicle.model}`}
              year={vehicle.year}
              mileage={vehicle.mileage}
              currentBid={vehicle.current_bid}
              timeLeft={calculateTimeLeft(vehicle.auction_end_time)}
              image={vehicle.image_url || ""}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No auctions available at the moment</p>
        </div>
      )}
    </section>
  );
};

export default FeaturedAuctions;
