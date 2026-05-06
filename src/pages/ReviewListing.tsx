import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { updateVehicleApprovalStatus } from "@/db/mutations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VehicleGallery } from "@/components/VehicleGallery";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, Gauge, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, getVehicleTitle } from "@/lib/utils";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin: string | null;
  description: string | null;
  images: string[];
  current_bid: number;
  bid_count: number;
  reserve_price: number | null;
  auction_end_time: string;
  status: string;
  approval_status: string;
  admin_notes: string | null;
  seller_id: string;
  created_at: string;
}

const ReviewListing = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "decline" | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchVehicle = async () => {
      const { data, error } = await supabase.from("vehicles").select("translation:*").eq("id", id).single();

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching vehicle:", error);
        toast.error(t("translation:errors.failedLoadListing"));
        navigate("/admin");
        return;
      }

      setVehicle(data);
      setAdminNotes(data.admin_notes || "");
      setLoading(false);
    };

    fetchVehicle();
  }, [id, navigate, t]);

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const { error } = await updateVehicleApprovalStatus(id!, status, notes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      toast.success(t("translation:admin.listingStatusUpdated"));
      navigate("/admin");
    },
    onError: (error) => {
      console.error("Error updating listing:", error);
      toast.error(t("translation:admin.listingStatusFailed"));
    },
  });

  const handleAction = (action: "approve" | "decline") => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!dialogAction) return;
    updateVehicleMutation.mutate({ status: dialogAction === "approve" ? "approved" : "declined", notes: adminNotes });
    setDialogOpen(false);
  };

  if (authLoading || adminLoading || loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!vehicle) {
    return (
      <main className="container mx-auto flex-1 py-8">
        <p className="text-center text-muted-foreground">{t("translation:admin.listingNotFound")}</p>
      </main>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />{t("translation:myListings.approved")}</Badge>;
      case "declined":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />{t("translation:admin.declinedTab")}</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{t("translation:myListings.pendingReview")}</Badge>;
    }
  };

  return (
    <>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("translation:admin.backToDashboard")}
          </Button>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-3xl">{getVehicleTitle(vehicle)}</CardTitle>
                    {getStatusBadge(vehicle.approval_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <VehicleGallery images={vehicle.images || []} vehicleName={getVehicleTitle(vehicle)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("translation:vehicle.description")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-foreground">{vehicle.description || t("translation:common.noDescriptionProvided")}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("translation:vehicle.vehicleDetails")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("translation:vehicle.year")}</p>
                        <p className="font-semibold">{vehicle.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("translation:vehicle.mileage")}</p>
                        <p className="font-semibold">{vehicle.mileage?.toLocaleString()} km</p>
                      </div>
                    </div>
                    {vehicle.vin && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">{t("translation:vehicle.vin")}</p>
                        <p className="font-mono text-sm">{vehicle.vin}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("translation:vehicle.auctionInformation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("translation:vehicle.currentBid")}</p>
                    <p className="text-2xl font-bold">{formatCurrency(vehicle.current_bid)}</p>
                    <p className="text-sm text-muted-foreground">{t("translation:bidding.bid", { count: vehicle.bid_count })}</p>
                  </div>
                  <Separator />
                  {vehicle.reserve_price && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("translation:myListings.reservePrice")}</p>
                      <p className="text-lg font-semibold">{formatCurrency(vehicle.reserve_price)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">{t("translation:vehicle.auctionEnds")}</p>
                    <p className="font-semibold">{new Date(vehicle.auction_end_time).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("translation:vehicle.submitted")}</p>
                    <p className="font-semibold">{new Date(vehicle.created_at).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("translation:admin.adminActions")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-notes">{t("translation:admin.adminNotes")}</Label>
                    <Textarea id="admin-notes" placeholder={t("translation:admin.addInternalNotes")} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} />
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction("approve")} className="flex-1" disabled={updateVehicleMutation.isPending}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t("translation:admin.approve")}
                    </Button>
                    <Button onClick={() => handleAction("decline")} variant="destructive" className="flex-1" disabled={updateVehicleMutation.isPending}>
                      <XCircle className="mr-2 h-4 w-4" />
                      {t("translation:admin.decline")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogAction === "approve" ? t("translation:admin.approveListing") : t("translation:admin.declineListing")}</DialogTitle>
            <DialogDescription>
              {dialogAction && t("translation:admin.approveOrDeclineQuestion", { action: dialogAction === "approve" ? t("translation:admin.approve").toLowerCase() : t("translation:admin.decline").toLowerCase() })}
              {dialogAction === "decline" && ` ${t("translation:admin.sellerWillBeNotified")}`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("translation:common.cancel")}</Button>
            <Button onClick={handleConfirm} variant={dialogAction === "approve" ? "default" : "destructive"} disabled={updateVehicleMutation.isPending}>
              {updateVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogAction === "approve" ? t("translation:admin.confirmApproval") : t("translation:admin.confirmDecline")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewListing;
