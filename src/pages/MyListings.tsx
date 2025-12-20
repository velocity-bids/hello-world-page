import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { supabase } from "@/integrations/supabase/client";
import { getVehiclesBySeller } from "@/db/queries";
import { deleteVehicle } from "@/db/mutations";
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
import Navbar from "@/components/Navbar";
import { PageLoader, EmptyState } from "@/components/common";
import { Clock, DollarSign, Gavel, Eye, AlertCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Vehicle } from "@/types";

interface VehicleWithApproval extends Vehicle {
  approval_status: string;
}

const MyListings = () => {
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [vehicles, setVehicles] = useState<VehicleWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [user, authLoading, openLoginModal]);

  useEffect(() => {
    if (user) {
      fetchVehicles();
      const unsubscribe = subscribeToVehicleUpdates();
      return unsubscribe;
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await getVehiclesBySeller(user?.id || "");

      if (error) throw error;
      setVehicles((data as VehicleWithApproval[]) || []);
    } catch {
      toast.error("Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToVehicleUpdates = () => {
    const channel = supabase
      .channel("vehicle-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles", filter: `seller_id=eq.${user?.id}` },
        () => fetchVehicles()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const handleDeleteListing = async (vehicleId: string, vehicleTitle: string) => {
    if (!user?.id) return;
    
    setDeletingId(vehicleId);
    try {
      const { error } = await deleteVehicle(vehicleId, user.id);

      if (error) throw error;

      toast.success(`"${vehicleTitle}" has been deleted`);
      // Remove from local state immediately
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const canDeleteListing = (vehicle: VehicleWithApproval) => {
    // Can only delete if no bids have been placed
    return (vehicle.bid_count || 0) === 0;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      ended: "secondary",
      sold: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const getApprovalBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
    };
    const labels: Record<string, string> = { pending: "Pending Review", approved: "Approved", rejected: "Rejected" };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    if (end < new Date()) return "Auction ended";
    return formatDistanceToNow(end, { addSuffix: true });
  };

  const stats = {
    active: vehicles.filter((v) => v.status === "active").length,
    pending: vehicles.filter((v) => v.approval_status === "pending").length,
    totalBids: vehicles.reduce((sum, v) => sum + (v.bid_count || 0), 0),
    totalValue: vehicles.filter((v) => v.status === "active").reduce((sum, v) => sum + (v.current_bid || 0), 0),
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <PageLoader message="Loading your listings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">Manage your vehicle auctions</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Active Auctions", value: stats.active, icon: Gavel },
            { label: "Pending Approval", value: stats.pending, icon: AlertCircle },
            { label: "Total Bids", value: stats.totalBids, icon: DollarSign },
            { label: "Current Value", value: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign },
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
            title="No listings yet"
            description="Start by creating your first vehicle listing"
            action={{ label: "Create Listing", onClick: () => window.location.href = "/sell" }}
          />
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => {
              const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
              const canDelete = canDeleteListing(vehicle);
              const isDeleting = deletingId === vehicle.id;

              return (
                <Card key={vehicle.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative h-48 w-full md:h-auto md:w-64">
                      <img
                        src={vehicle.images?.[0] || vehicle.image_url || "/placeholder.svg"}
                        alt={vehicleTitle}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-bold">{vehicleTitle}</h3>
                          <p className="text-sm text-muted-foreground">{vehicle.mileage.toLocaleString()} miles</p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(vehicle.status || "active")}
                          {getApprovalBadge(vehicle.approval_status)}
                        </div>
                      </div>
                      <div className="mb-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Bid</p>
                          <p className="text-lg font-bold">${vehicle.current_bid?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Number of Bids</p>
                          <p className="text-lg font-bold">{vehicle.bid_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Time Remaining</p>
                          <p className="text-lg font-bold">{getTimeRemaining(vehicle.auction_end_time)}</p>
                        </div>
                      </div>
                      {vehicle.reserve_price && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Reserve Price</p>
                          <p className="font-semibold">
                            ${vehicle.reserve_price.toLocaleString()}
                            {vehicle.current_bid >= vehicle.reserve_price && (
                              <Badge variant="default" className="ml-2">Reserve Met</Badge>
                            )}
                          </p>
                        </div>
                      )}
                      <div className="mt-auto flex flex-wrap gap-2">
                        <Link to={`/vehicle/${vehicle.id}`}>
                          <Button variant="outline">
                            <Eye className="mr-2 h-4 w-4" />View
                          </Button>
                        </Link>
                        
                        {/* Edit button */}
                        <Link to={`/edit-listing/${vehicle.id}`}>
                          <Button variant="outline">
                            <Pencil className="mr-2 h-4 w-4" />
                            {(vehicle.bid_count || 0) > 0 ? "Edit (Limited)" : "Edit"}
                          </Button>
                        </Link>

                        {/* Delete button with confirmation */}
                        {canDelete ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" className="text-destructive hover:text-destructive" disabled={isDeleting}>
                                {isDeleting ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{vehicleTitle}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteListing(vehicle.id, vehicleTitle)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="outline"
                            disabled
                            className="text-muted-foreground cursor-not-allowed"
                            title="Cannot delete listings with bids"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
    </div>
  );
};

export default MyListings;
