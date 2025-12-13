import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { updateVehicleApprovalStatus } from "@/db/mutations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BasePage } from "@/components/BasePage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VehicleGallery } from "@/components/VehicleGallery";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Gauge,
  Calendar,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<
    "approve" | "decline" | null
  >(null);

  useEffect(() => {
    if (!id) return;

    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();
      console.log("🚀 ~ fetchVehicle ~ data, error :", data, error);

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching vehicle:", error);
        }
        toast.error("Failed to load listing");
        navigate("/admin");
        return;
      }

      setVehicle(data);
      setAdminNotes(data.admin_notes || "");
      setLoading(false);
    };

    fetchVehicle();
  }, [id, navigate]);

  const updateVehicleMutation = useMutation({
    mutationFn: async ({
      status,
      notes,
    }: {
      status: string;
      notes?: string;
    }) => {
      const { error } = await updateVehicleApprovalStatus(id!, status, notes);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      toast.success("Listing status updated successfully");
      navigate("/admin");
    },
    onError: (error) => {
      console.error("Error updating listing:", error);
      toast.error("Failed to update listing status");
    },
  });

  const handleAction = (action: "approve" | "decline") => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!dialogAction) return;

    updateVehicleMutation.mutate({
      status: dialogAction === "approve" ? "approved" : "declined",
      notes: adminNotes,
    });
    setDialogOpen(false);
  };

  if (adminLoading || loading) {
    return (
      <BasePage>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BasePage>
    );
  }

  if (!user || !isAdmin) {
    navigate("/");
    return null;
  }

  if (!vehicle) {
    return (
      <BasePage>
        <div className="container mx-auto py-8">
          <p className="text-center text-muted-foreground">Listing not found</p>
        </div>
      </BasePage>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  return (
    <BasePage>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardTitle>
                  {getStatusBadge(vehicle.approval_status)}
                </div>
              </CardHeader>
              <CardContent>
                <VehicleGallery
                  images={vehicle.images || []}
                  vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {vehicle.description || "No description provided"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Year</p>
                      <p className="font-semibold">{vehicle.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-semibold">
                        {vehicle.mileage?.toLocaleString()} miles
                      </p>
                    </div>
                  </div>
                  {vehicle.vin && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">VIN</p>
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
                <CardTitle>Auction Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Bid</p>
                  <p className="text-2xl font-bold">
                    ${vehicle.current_bid.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.bid_count} bids
                  </p>
                </div>
                <Separator />
                {vehicle.reserve_price && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Reserve Price
                    </p>
                    <p className="text-lg font-semibold">
                      ${vehicle.reserve_price.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Auction Ends</p>
                  <p className="font-semibold">
                    {new Date(vehicle.auction_end_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-semibold">
                    {new Date(vehicle.created_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Admin Notes</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add internal notes about this listing..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAction("approve")}
                    className="flex-1"
                    disabled={updateVehicleMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleAction("decline")}
                    variant="destructive"
                    className="flex-1"
                    disabled={updateVehicleMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve"
                ? "Approve Listing"
                : "Decline Listing"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {dialogAction} this listing?
              {dialogAction === "decline" && " The seller will be notified."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant={dialogAction === "approve" ? "default" : "destructive"}
              disabled={updateVehicleMutation.isPending}
            >
              {updateVehicleMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm {dialogAction === "approve" ? "Approval" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BasePage>
  );
};

export default ReviewListing;
