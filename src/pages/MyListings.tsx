import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Loader2, Clock, DollarSign, Gavel, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  current_bid: number;
  bid_count: number;
  reserve_price: number | null;
  auction_end_time: string;
  status: string;
  approval_status: string;
  images: string[];
  image_url: string | null;
  created_at: string;
}

const MyListings = () => {
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
    }
  }, [user, authLoading, openLoginModal]);

  useEffect(() => {
    if (user) {
      fetchVehicles();
      subscribeToVehicleUpdates();
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("seller_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      toast.error("Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToVehicleUpdates = () => {
    const channel = supabase
      .channel('vehicle-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
          filter: `seller_id=eq.${user?.id}`
        },
        () => {
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    const labels: Record<string, string> = {
      pending: "Pending Review",
      approved: "Approved",
      rejected: "Rejected",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    if (end < now) return "Auction ended";
    return formatDistanceToNow(end, { addSuffix: true });
  };

  const calculateStats = () => {
    const active = vehicles.filter(v => v.status === 'active').length;
    const pending = vehicles.filter(v => v.approval_status === 'pending').length;
    const totalBids = vehicles.reduce((sum, v) => sum + (v.bid_count || 0), 0);
    const totalValue = vehicles
      .filter(v => v.status === 'active')
      .reduce((sum, v) => sum + (v.current_bid || 0), 0);

    return { active, pending, totalBids, totalValue };
  };

  const stats = calculateStats();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
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

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Auctions</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Gavel className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bids</p>
                <p className="text-2xl font-bold">{stats.totalBids}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Listings */}
        {vehicles.length === 0 ? (
          <Card className="p-12 text-center">
            <Gavel className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No listings yet</h2>
            <p className="mb-6 text-muted-foreground">Start by creating your first vehicle listing</p>
            <Link to="/sell">
              <Button>Create Listing</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Vehicle Image */}
                  <div className="relative h-48 w-full md:h-auto md:w-64">
                    <img
                      src={vehicle.images?.[0] || vehicle.image_url || "/placeholder.svg"}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Vehicle Details */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-bold">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.mileage.toLocaleString()} miles
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(vehicle.status)}
                        {getApprovalBadge(vehicle.approval_status)}
                      </div>
                    </div>

                    {/* Auction Stats */}
                    <div className="mb-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Bid</p>
                        <p className="text-lg font-bold">
                          ${vehicle.current_bid?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Number of Bids</p>
                        <p className="text-lg font-bold">{vehicle.bid_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time Remaining</p>
                        <p className="text-lg font-bold">
                          {getTimeRemaining(vehicle.auction_end_time)}
                        </p>
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

                    {/* Actions */}
                    <div className="mt-auto flex gap-2">
                      <Link to={`/vehicle/${vehicle.id}`}>
                        <Button variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          View Listing
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyListings;
