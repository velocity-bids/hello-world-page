import { useState, useMemo } from "react";
import { BasePage } from "@/components/BasePage";
import { useVehicles } from "@/hooks/useVehicles";
import VehicleCard from "@/components/VehicleCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";

const Auctions = () => {
  const { vehicles, loading } = useVehicles();
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [maxMileage, setMaxMileage] = useState<number>(200000);

  // Get unique brands from vehicles
  const brands = useMemo(() => {
    const uniqueBrands = new Set(vehicles.map(v => v.make));
    return Array.from(uniqueBrands).sort();
  }, [vehicles]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const brandMatch = selectedBrand === "all" || vehicle.make === selectedBrand;
      const mileageMatch = vehicle.mileage <= maxMileage;
      return brandMatch && mileageMatch;
    });
  }, [vehicles, selectedBrand, maxMileage]);

  const calculateTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <BasePage>
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">All Auctions</h1>
              <p className="text-muted-foreground">Browse all active vehicle auctions</p>
            </div>

            {/* Filters */}
            <div className="mb-8 space-y-6 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Max Mileage: {maxMileage.toLocaleString()} mi
                </label>
                <Slider
                  value={[maxMileage]}
                  onValueChange={(value) => setMaxMileage(value[0])}
                  min={0}
                  max={200000}
                  step={5000}
                  className="w-full"
                />
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-96" />
                ))}
              </div>
            ) : filteredVehicles.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {filteredVehicles.length} {filteredVehicles.length === 1 ? 'auction' : 'auctions'} found
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      id={vehicle.id}
                      title={`${vehicle.make} ${vehicle.model}`}
                      year={vehicle.year}
                      mileage={vehicle.mileage}
                      currentBid={vehicle.current_bid}
                      timeLeft={calculateTimeLeft(vehicle.auction_end_time)}
                      image={vehicle.image_url || "/placeholder.svg"}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No auctions found matching your filters</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </BasePage>
  );
};

export default Auctions;
