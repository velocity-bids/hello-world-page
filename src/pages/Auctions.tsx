import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BasePage } from "@/components/BasePage";
import { useFilteredVehicles } from "@/hooks/useFilteredVehicles";
import { useVehicleBrands } from "@/hooks/useVehicleBrands";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { deleteVehicleAdmin } from "@/db/mutations";
import VehicleCard from "@/components/VehicleCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getVehicleModels } from "@/db/queries";
import { getVehicleTitle } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

const MILEAGE_OPTIONS = [
  { label: "Any mileage", value: "any" },
  { label: "Até 10.000 km", value: "10000" },
  { label: "Até 25.000 km", value: "25000" },
  { label: "Até 50.000 km", value: "50000" },
  { label: "Até 75.000 km", value: "75000" },
  { label: "Até 100.000 km", value: "100000" },
  { label: "Até 150.000 km", value: "150000" },
  { label: "Até 200.000 km", value: "200000" },
];

const Auctions = () => {
  const [searchParams] = useSearchParams();

  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const b = searchParams.get("brand");
    return b ? [b] : [];
  });
  const [selectedModel, setSelectedModel] = useState<string>(searchParams.get("model") ?? "all");
  const [yearFrom, setYearFrom] = useState<string>(searchParams.get("yearFrom") ?? "any");
  const [yearTo, setYearTo] = useState<string>(searchParams.get("yearTo") ?? "any");
  const [selectedMileage, setSelectedMileage] = useState<string>(
    searchParams.get("maxMileage") ?? "any"
  );
  const [page, setPage] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [models, setModels] = useState<string[]>([]);

  const { isAdmin } = useIsAdmin();
  const { brands } = useVehicleBrands();
  const { vehicles, loading, hasMore, removeVehicle } = useFilteredVehicles({
    brands: selectedBrands.length > 0 ? selectedBrands : undefined,
    model: selectedModel === "all" ? undefined : selectedModel,
    yearFrom: yearFrom !== "any" ? parseInt(yearFrom) : undefined,
    yearTo: yearTo !== "any" ? parseInt(yearTo) : undefined,
    maxMileage: selectedMileage !== "any" ? parseInt(selectedMileage) : 200000,
    page,
    pageSize: 12,
  });

  useEffect(() => {
    if (selectedBrands.length === 1) {
      getVehicleModels(selectedBrands[0]).then(({ data }) => setModels(data));
    } else {
      setModels([]);
      setSelectedModel("all");
    }
  }, [selectedBrands]);

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

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedBrands, selectedModel, yearFrom, yearTo, selectedMileage]);

  // Infinite scroll
  const onLoadMore = useCallback(() => setPage(prev => prev + 1), []);
  const { loadMoreRef } = useInfiniteScroll({ hasMore, loading, onLoadMore });

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
            <div className="mb-6 bg-background rounded-2xl border border-border shadow-sm p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Make</label>
                  <MultiSelect
                    options={brands}
                    selected={selectedBrands}
                    onChange={setSelectedBrands}
                    placeholder="Any make"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={selectedBrands.length !== 1 || models.length === 0}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any model</SelectItem>
                      {models.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year from</label>
                  <Select value={yearFrom} onValueChange={setYearFrom}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any year</SelectItem>
                      {YEARS.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year to</label>
                  <Select value={yearTo} onValueChange={setYearTo}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any year</SelectItem>
                      {YEARS.filter(y => yearFrom === "any" || y >= parseInt(yearFrom)).map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max mileage</label>
                  <Select value={selectedMileage} onValueChange={setSelectedMileage}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any mileage" />
                    </SelectTrigger>
                    <SelectContent>
                      {MILEAGE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filter badges */}
              {(selectedBrands.length > 0 || selectedModel !== "all" || yearFrom !== "any" || yearTo !== "any" || selectedMileage !== "any") && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {selectedBrands.map(b => (
                    <Badge key={b} variant="secondary" className="flex items-center gap-1">
                      {b}
                      <button onClick={() => setSelectedBrands(selectedBrands.filter(v => v !== b))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                  {selectedModel !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Model: {selectedModel}
                      <button onClick={() => setSelectedModel("all")}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {(yearFrom !== "any" || yearTo !== "any") && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Year: {yearFrom !== "any" ? yearFrom : "…"} – {yearTo !== "any" ? yearTo : "…"}
                      <button onClick={() => { setYearFrom("any"); setYearTo("any"); }}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {selectedMileage !== "any" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {MILEAGE_OPTIONS.find(o => o.value === selectedMileage)?.label}
                      <button onClick={() => setSelectedMileage("any")}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                </div>
              )}
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
                        title={getVehicleTitle(vehicle)}
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
                            handleDeleteVehicle(vehicle.id, getVehicleTitle(vehicle));
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Vehicle"
        description="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmLabel="Delete Vehicle"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      >
        {vehicleToDelete && (
          <div className="py-4">
            <p className="text-sm font-medium">{vehicleToDelete.title}</p>
          </div>
        )}
      </ConfirmDialog>
    </BasePage>
  );
};

export default Auctions;
