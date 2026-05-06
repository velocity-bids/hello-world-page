import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { supabase } from "@/integrations/supabase/client";
import { getVehiclesBySeller } from "@/db/queries";
import { deleteVehicle } from "@/db/mutations";
import { vehicleKeys } from "@/lib/queryKeys";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageLoader, EmptyState } from "@/components/common";
import { Euro, Gavel, Eye, AlertCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Vehicle } from "@/types";
import { formatCurrency, getVehicleTitle } from "@/lib/utils";

interface VehicleWithApproval extends Vehicle {
  approval_status: string;
}

const MyListings = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sellerListingsQueryKey = user ? vehicleKeys.list({ sellerId: user.id }) : vehicleKeys.lists();

  const { data: vehicles = [], isLoading, error } = useQuery<VehicleWithApproval[]>({
    queryKey: sellerListingsQueryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getVehiclesBySeller(user.id);
      if (error) throw error;
      return (data ?? []) as VehicleWithApproval[];
    },
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [user, authLoading, openLoginModal]);

  useEffect(() => {
    if (!error) return;
    toast.error(t("translation:myListings.loadFailed"));
  }, [error, t]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("vehicle-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles", filter: `seller_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.list({ sellerId: user.id }) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleDeleteListing = async (vehicleId: string, vehicleTitle: string) => {
    if (!user?.id) return;

    setDeletingId(vehicleId);
    try {
      const { error } = await deleteVehicle(vehicleId, user.id);
      if (error) throw error;

      toast.success(t("translation:myListings.deleted", { title: vehicleTitle }));
      queryClient.setQueryData<VehicleWithApproval[]>(sellerListingsQueryKey, (currentVehicles) =>
        currentVehicles?.filter((vehicle) => vehicle.id !== vehicleId) ?? []
      );
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error(t("translation:myListings.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  const canDeleteListing = (vehicle: VehicleWithApproval) => (vehicle.bid_count || 0) === 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      ended: "secondary",
      sold: "secondary",
    };
    const labels: Record<string, string> = {
      active: t("translation:myListings.active"),
      ended: t("translation:myListings.ended"),
      sold: t("translation:myListings.sold"),
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const getApprovalBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
    };
    const labels: Record<string, string> = {
      pending: t("translation:myListings.pendingReview"),
      approved: t("translation:myListings.approved"),
      rejected: t("translation:myListings.rejected"),
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    if (end < new Date()) return t("translation:myListings.auctionEnded");
    return formatDistanceToNow(end, { addSuffix: true });
  };

  const stats = {
    active: vehicles.filter((v) => v.status === "active").length,
    pending: vehicles.filter((v) => v.approval_status === "pending").length,
    totalBids: vehicles.reduce((sum, v) => sum + (v.bid_count || 0), 0),
    totalValue: vehicles.filter((v) => v.status === "active").reduce((sum, v) => sum + (v.current_bid || 0), 0),
  };

  if (authLoading || isLoading) {
    return (
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-12">
          <PageLoader message={t("translation:myListings.loading")} />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex-1 px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t("translation:myListings.title")}</h1>
        <p className="text-muted-foreground">{t("translation:myListings.description")}</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          { label: t("translation:myListings.activeAuctions"), value: stats.active, icon: Gavel },
          { label: t("translation:myListings.pendingApproval"), value: stats.pending, icon: AlertCircle },
          { label: t("translation:myListings.totalBids"), value: stats.totalBids, icon: Euro },
          { label: t("translation:myListings.currentValue"), value: formatCurrency(stats.totalValue), icon: Euro },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title={t("translation:myListings.noListingsTitle")}
          description={t("translation:myListings.noListingsDescription")}
          action={{ label: t("translation:createListing.createListing"), onClick: () => { window.location.href = "/sell"; } }}
        />
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => {
            const vehicleTitle = getVehicleTitle(vehicle);
            const canDelete = canDeleteListing(vehicle);
            const isDeleting = deletingId === vehicle.id;

            return (
              <Card key={vehicle.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="relative h-48 w-full md:h-auto md:w-64">
                    <img src={vehicle.images?.[0] || vehicle.image_url || "/placeholder.svg"} alt={vehicleTitle} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-bold">{vehicleTitle}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.mileage.toLocaleString()} km</p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(vehicle.status || "active")}
                        {getApprovalBadge(vehicle.approval_status)}
                      </div>
                    </div>
                    <div className="mb-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("translation:vehicle.currentBid")}</p>
                        <p className="text-lg font-bold">{formatCurrency(vehicle.current_bid || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("translation:myListings.numberOfBids")}</p>
                        <p className="text-lg font-bold">{vehicle.bid_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("translation:myListings.timeRemaining")}</p>
                        <p className="text-lg font-bold">{getTimeRemaining(vehicle.auction_end_time)}</p>
                      </div>
                    </div>
                    {vehicle.reserve_price && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">{t("translation:myListings.reservePrice")}</p>
                        <p className="font-semibold">
                          {formatCurrency(vehicle.reserve_price)}
                          {vehicle.current_bid >= vehicle.reserve_price && <Badge variant="default" className="ml-2">{t("translation:vehicle.reserveMet")}</Badge>}
                        </p>
                      </div>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Link to={`/vehicle/${vehicle.id}`}>
                        <Button variant="outline">
                          <Eye className="mr-2 h-4 w-4" />{t("translation:common.view")}
                        </Button>
                      </Link>

                      <Link to={`/edit-listing/${vehicle.id}`}>
                        <Button variant="outline">
                          <Pencil className="mr-2 h-4 w-4" />
                          {(vehicle.bid_count || 0) > 0 ? t("translation:myListings.editLimited") : t("translation:myListings.edit")}
                        </Button>
                      </Link>

                      {canDelete ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="text-destructive hover:text-destructive" disabled={isDeleting}>
                              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                              {t("translation:myListings.delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("translation:myListings.deleteTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("translation:myListings.deleteDescription", { title: vehicleTitle })}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("translation:common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteListing(vehicle.id, vehicleTitle)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {t("translation:myListings.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button variant="outline" disabled className="cursor-not-allowed text-muted-foreground" title={t("translation:myListings.cannotDeleteWithBids")}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("translation:myListings.delete")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default MyListings;
