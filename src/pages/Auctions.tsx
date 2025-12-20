import { useState, useEffect, useRef, useCallback } from "react";
import { BasePage } from "@/components/BasePage";
import { useFilteredVehicles } from "@/hooks/useFilteredVehicles";
import { useVehicleBrands } from "@/hooks/useVehicleBrands";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { deleteVehicleAdmin } from "@/db/mutations";
import VehicleCard from "@/components/VehicleCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Auctions = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [sliderValue, setSliderValue] = useState<number>(200000);
  const [maxMileage, setMaxMileage] = useState<number>(200000);
  const [page, setPage] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { isAdmin } = useIsAdmin();
  const { brands } = useVehicleBrands();
  const { vehicles, loading, hasMore, removeVehicle } = useFilteredVehicles({
    brand: selectedBrand,
    maxMileage,
    page,
    pageSize: 12
  });

  const handleDeleteVehicle = (vehicleId: string, vehicleTitle: string) => {
    setVehicleToDelete({ id: vehicleId, title: vehicleTitle });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;
    
    setDeleting(true);
    const { error } = await deleteVehicleAdmin(vehicleToDelete.id);
    
    if (error) {
      toast.error("Failed to delete vehicle");
    } else {
      toast.success("Vehicle deleted successfully");
      removeVehicle(vehicleToDelete.id);
    }
    
    setDeleting(false);
    setDeleteDialogOpen(false);
    setVehicleToDelete(null);
  };

  // Debounce mileage slider
  useEffect(() => {
    const timer = setTimeout(() => {
      setMaxMileage(sliderValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [sliderValue]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedBrand, maxMileage]);

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [handleObserver]);

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
                  Max Mileage: {sliderValue.toLocaleString()} mi
                </label>
                <Slider
                  value={[sliderValue]}
                  onValueChange={(value) => setSliderValue(value[0])}
                  min={0}
                  max={200000}
                  step={5000}
                  className="w-full"
                />
              </div>
            </div>

            {/* Results */}
            {loading && page === 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-96" />
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {vehicles.length} {vehicles.length === 1 ? 'auction' : 'auctions'} found
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="relative group">
                      <VehicleCard
                        id={vehicle.id}
                        title={`${vehicle.make} ${vehicle.model}`}
                        year={vehicle.year}
                        mileage={vehicle.mileage}
                        currentBid={vehicle.current_bid}
                        timeLeft={calculateTimeLeft(vehicle.auction_end_time)}
                        image={vehicle.image_url || "/placeholder.svg"}
                      />
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteVehicle(vehicle.id, `${vehicle.year} ${vehicle.make} ${vehicle.model}`);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Load more trigger */}
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                  {loading && (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  )}
                  {!hasMore && vehicles.length > 0 && (
                    <p className="text-sm text-muted-foreground">No more auctions to load</p>
                  )}
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {vehicleToDelete && (
            <div className="py-4">
              <p className="text-sm font-medium">{vehicleToDelete.title}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BasePage>
  );
};

export default Auctions;
