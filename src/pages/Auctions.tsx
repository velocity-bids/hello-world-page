import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
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

const Auctions = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const mileageOptions = [
    { label: t("translation:vehicle.anyMileage"), value: "any" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "10,000" }), value: "10000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "25,000" }), value: "25000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "50,000" }), value: "50000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "75,000" }), value: "75000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "100,000" }), value: "100000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "150,000" }), value: "150000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "200,000" }), value: "200000" },
  ];

  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const b = searchParams.get("translation:brand");
    return b ? [b] : [];
  });
  const [selectedModel, setSelectedModel] = useState<string>(searchParams.get("translation:model") ?? "all");
  const [yearFrom, setYearFrom] = useState<string>(searchParams.get("translation:yearFrom") ?? "any");
  const [yearTo, setYearTo] = useState<string>(searchParams.get("translation:yearTo") ?? "any");
  const [selectedMileage, setSelectedMileage] = useState<string>(searchParams.get("translation:maxMileage") ?? "any");
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
      toast.error(t("translation:admin.vehicleDeleteFailed"));
    } else {
      toast.success(t("translation:admin.vehicleDeleted"));
      removeVehicle(vehicleToDelete.id);
    }

    setDeleting(false);
    setDeleteDialogOpen(false);
    setVehicleToDelete(null);
  };

  useEffect(() => {
    setPage(0);
  }, [selectedBrands, selectedModel, yearFrom, yearTo, selectedMileage]);

  const onLoadMore = useCallback(() => setPage((prev) => prev + 1), []);
  const { loadMoreRef } = useInfiniteScroll({ hasMore, loading, onLoadMore });

  const calculateTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return t("translation:common.ended");

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return t("translation:common.timeDaysHours", { days, hours });
    return t("translation:common.timeHours", { hours });
  };

  return (
    <>
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold">{t("translation:auctions.allTitle")}</h1>
              <p className="text-muted-foreground">{t("translation:auctions.allDescription")}</p>
            </div>

            <div className="mb-6 rounded-2xl border border-border bg-background p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.make")}</label>
                  <MultiSelect options={brands} selected={selectedBrands} onChange={setSelectedBrands} placeholder={t("translation:vehicle.anyMake")} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.model")}</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel} disabled={selectedBrands.length !== 1 || models.length === 0}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyModel")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("translation:vehicle.anyModel")}</SelectItem>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.yearFrom")}</label>
                  <Select value={yearFrom} onValueChange={setYearFrom}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("translation:vehicle.anyYear")}</SelectItem>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.yearTo")}</label>
                  <Select value={yearTo} onValueChange={setYearTo}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("translation:vehicle.anyYear")}</SelectItem>
                      {YEARS.filter((y) => yearFrom === "any" || y >= parseInt(yearFrom)).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.maxMileage")}</label>
                  <Select value={selectedMileage} onValueChange={setSelectedMileage}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyMileage")} />
                    </SelectTrigger>
                    <SelectContent>
                      {mileageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(selectedBrands.length > 0 || selectedModel !== "all" || yearFrom !== "any" || yearTo !== "any" || selectedMileage !== "any") && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {selectedBrands.map((brand) => (
                    <Badge key={brand} variant="secondary" className="flex items-center gap-1">
                      {brand}
                      <button onClick={() => setSelectedBrands(selectedBrands.filter((value) => value !== brand))} aria-label={t("translation:common.delete")}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedModel !== "all" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {t("translation:vehicle.model")}: {selectedModel}
                      <button onClick={() => setSelectedModel("all")} aria-label={t("translation:common.delete")}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {(yearFrom !== "any" || yearTo !== "any") && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {t("translation:vehicle.year")}: {yearFrom !== "any" ? yearFrom : "…"} – {yearTo !== "any" ? yearTo : "…"}
                      <button onClick={() => { setYearFrom("any"); setYearTo("any"); }} aria-label={t("translation:common.delete")}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedMileage !== "any" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {mileageOptions.find((option) => option.value === selectedMileage)?.label}
                      <button onClick={() => setSelectedMileage("any")} aria-label={t("translation:common.delete")}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {loading && page === 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-96" />
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">{t("translation:auctions.listingsFound", { count: vehicles.length })}</p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="group relative">
                      <VehicleCard
                        id={vehicle.id}
                        title={getVehicleTitle(vehicle)}
                        year={vehicle.year}
                        mileage={vehicle.mileage}
                        currentBid={vehicle.current_bid}
                        timeLeft={calculateTimeLeft(vehicle.auction_end_time)}
                        image={vehicle.image_url || "/placeholder.svg"}
                        reserveMet={vehicle.reserve_price ? vehicle.current_bid >= vehicle.reserve_price : true}
                      />
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteVehicle(vehicle.id, getVehicleTitle(vehicle));
                          }}
                          aria-label={t("translation:admin.deleteVehicle")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                  {!hasMore && vehicles.length > 0 && <p className="text-sm text-muted-foreground">{t("translation:auctions.noMore")}</p>}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{t("translation:auctions.noResults")}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("translation:admin.deleteVehicle")}
        description={t("translation:admin.deleteVehicleDescription")}
        confirmLabel={t("translation:admin.deleteVehicle")}
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
    </>
  );
};

export default Auctions;
