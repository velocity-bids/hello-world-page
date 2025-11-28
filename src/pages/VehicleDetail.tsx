import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { VehicleGallery } from "@/components/VehicleGallery";
import { CommentSection } from "@/components/CommentSection";
import { Clock, Gauge, Calendar, MapPin, Eye, Heart, User, TrendingUp } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { toast } from "sonner";
import { BidHistoryModal } from "@/components/BidHistoryModal";
// import { useWatchedVehicles } from "@/hooks/useWatchedVehicles";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin: string | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  current_bid: number;
  bid_count: number;
  reserve_price: number | null;
  auction_end_time: string;
  status: string;
  seller_id: string;
  profiles?: {
    display_name: string | null;
    verified: boolean | null;
  } | null;
}

interface Bid {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  profiles?: {
    display_name: string | null;
    verified: boolean | null;
  } | null;
}

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  // const { addToWatchlist, removeFromWatchlist, isWatching } = useWatchedVehicles();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);

  // Fetch vehicle data
  useEffect(() => {
    if (!id) return;

    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching vehicle:", error);
        }
        toast.error("Failed to load auction");
        navigate("/");
        return;
      }

      // Fetch seller profile
      const { data: sellerProfile } = await supabase
        .from("public_profiles")
        .select("display_name, verified")
        .eq("user_id", data.seller_id)
        .maybeSingle();

      setVehicle({
        ...data,
        profiles: sellerProfile,
      });
      setLoading(false);
    };

    fetchVehicle();
  }, [id, navigate]);

  // Fetch bids (latest 3 only)
  useEffect(() => {
    if (!id) return;

    const fetchBids = async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .eq("vehicle_id", id)
        .order("amount", { ascending: false })
        .limit(3);

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching bids:", error);
        }
        return;
      }

      // Fetch public profiles separately for each bid
      const bidsWithProfiles = await Promise.all(
        (data || []).map(async (bid) => {
          const { data: profileData } = await supabase
            .from("public_profiles")
            .select("display_name, verified")
            .eq("user_id", bid.bidder_id)
            .maybeSingle();

          return {
            ...bid,
            profiles: profileData,
          };
        })
      );

      setBids(bidsWithProfiles);
    };

    fetchBids();
  }, [id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!id) return;

    // Subscribe to vehicle updates
    const vehicleChannel = supabase
      .channel(`vehicle-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vehicles",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log("Vehicle updated:", payload);
          setVehicle(payload.new as Vehicle);
        }
      )
      .subscribe();

    // Subscribe to new bids
    const bidsChannel = supabase
      .channel(`bids-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `vehicle_id=eq.${id}`,
        },
        async (payload) => {
          console.log("New bid placed:", payload);
          
          // Fetch the bidder's public profile info
          const { data: profileData } = await supabase
            .from("public_profiles")
            .select("display_name, verified")
            .eq("user_id", (payload.new as any).bidder_id)
            .maybeSingle();

          const newBid = {
            ...payload.new as Bid,
            profiles: profileData,
          };

          setBids((prev) => [newBid, ...prev].slice(0, 3));
          toast.success("New bid placed!", {
            description: `$${(payload.new as any).amount.toLocaleString()}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehicleChannel);
      supabase.removeChannel(bidsChannel);
    };
  }, [id]);

  // Check if watching
  // useEffect(() => {
  //   if (!id) return;
    
  //   const checkWatchStatus = async () => {
  //     const status = await isWatching(id);
  //     setWatching(status);
  //   };
    
  //   checkWatchStatus();
  // }, [id, isWatching]);

  // Calculate time left
  useEffect(() => {
    if (!vehicle) return;

    const updateTimeLeft = () => {
      const end = new Date(vehicle.auction_end_time);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Auction Ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [vehicle]);

  const handlePlaceBid = async () => {
    if (!user) {
      toast.error("Please sign in to place a bid");
      openLoginModal();
      return;
    }

    if (!bidAmount || !vehicle) return;

    const amount = parseFloat(bidAmount);
    
    // Client-side validation for UX - server validates authoritatively
    const minBid = vehicle.current_bid > 0 ? vehicle.current_bid + 100 : 100;
    if (amount < minBid) {
      toast.error(`Minimum bid is $${minBid.toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    // Use server-side validation via RPC function
    const { data, error } = await supabase.rpc('place_bid', {
      p_vehicle_id: vehicle.id,
      p_amount: amount,
    });

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error placing bid:", error);
      }
      toast.error("Failed to place bid. Please try again.");
    } else if (data && typeof data === 'object' && 'error' in data && data.error) {
      toast.error(String(data.error));
    } else {
      toast.success("Bid placed successfully!");
      setBidAmount("");
    }

    setSubmitting(false);
  };

  // const handleWatchToggle = async () => {
  //   if (!user) {
  //     toast.error("Please sign in to watch auctions");
  //     navigate("/auth");
  //     return;
  //   }

  //   if (!id) return;

  //   setWatchLoading(true);
    
  //   if (watching) {
  //     const success = await removeFromWatchlist(id);
  //     if (success) {
  //       setWatching(false);
  //     }
  //   } else {
  //     const success = await addToWatchlist(id);
  //     if (success) {
  //       setWatching(true);
  //     }
  //   }
    
  //   setWatchLoading(false);
  // };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading auction...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!vehicle) return null;

  const isOwnListing = user?.id === vehicle.seller_id;
  const reserveMet = vehicle.reserve_price ? vehicle.current_bid >= vehicle.reserve_price : false;
  const minBid = vehicle.current_bid > 0 ? vehicle.current_bid + 100 : 100;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Gallery */}
              <div className="mb-6">
                <VehicleGallery
                  images={vehicle.images && vehicle.images.length > 0 
                    ? vehicle.images 
                    : [vehicle.image_url || "/placeholder.svg"]
                  }
                  vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                />
              </div>

              {/* Vehicle Info */}
              <div className="mb-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    {vehicle.status === "active" && (
                      <Badge className="mb-2 bg-accent">Live Auction</Badge>
                    )}
                    <h1 className="text-3xl font-bold">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h1>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{vehicle.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    <span>{vehicle.mileage.toLocaleString()} miles</span>
                  </div>
                  {vehicle.vin && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">VIN: {vehicle.vin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {vehicle.description && (
                <Card className="mb-6 p-6">
                  <h2 className="mb-4 text-2xl font-semibold">Description</h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {vehicle.description}
                  </p>
                </Card>
              )}

              {/* Comment Section */}
              <CommentSection vehicleId={vehicle.id} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                {/* Bidding Card */}
                <Card className="p-6">
                  <div className="mb-6 space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Bid</div>
                      <div className="text-3xl font-bold text-bid-active">
                        ${vehicle.current_bid.toLocaleString()}
                      </div>
                      {vehicle.bid_count > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {vehicle.bid_count} {vehicle.bid_count === 1 ? "bid" : "bids"}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-muted p-4">
                      <div className="mb-2 flex items-center gap-2 text-timer-warning">
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold">
                          {timeLeft === "Auction Ended" ? "Auction Ended" : "Ends In"}
                        </span>
                      </div>
                      <div className="text-2xl font-bold">{timeLeft}</div>
                    </div>

                    {vehicle.reserve_price && (
                      <div>
                        <div className="text-sm text-muted-foreground">Reserve Status</div>
                        <div
                          className={`font-medium ${
                            reserveMet ? "text-bid-active" : "text-muted-foreground"
                          }`}
                        >
                          {reserveMet ? "Reserve Met" : "Reserve Not Met"}
                        </div>
                      </div>
                    )}
                  </div>

                  {vehicle.status === "active" && timeLeft !== "Auction Ended" && (
                    <div className="space-y-3">
                      {isOwnListing ? (
                        <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                          You cannot bid on your own listing
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Input
                              placeholder={`Min: $${minBid.toLocaleString()}`}
                              type="number"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              min={minBid}
                              step="100"
                            />
                            <Button onClick={handlePlaceBid} disabled={submitting}>
                              {submitting ? "Placing..." : "Bid"}
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBidAmount(String((vehicle?.current_bid || 0) + 100))}
                            >
                              +$100
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBidAmount(String((vehicle?.current_bid || 0) + 500))}
                            >
                              +$500
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBidAmount(String((vehicle?.current_bid || 0) + 1000))}
                            >
                              +$1000
                            </Button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Minimum bid: ${minBid.toLocaleString()}
                          </p>
                        </>
                      )}
                      <Button 
                        variant={watching ? "default" : "outline"} 
                        className="w-full" 
                        onClick={() => {
                          console.log('is watching')
                        }}
                        disabled={watchLoading}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${watching ? "fill-current" : ""}`} />
                        {watchLoading ? "Loading..." : watching ? "Watching" : "Watch Auction"}
                      </Button>
                     </div>
                   )}
                 </Card>

                 {/* Seller Info */}
                 <Card className="p-6">
                   <h2 className="text-xl font-semibold mb-4">Seller</h2>
                   <Link 
                     to={`/user/${vehicle.seller_id}`}
                     className="flex items-center gap-3 hover:bg-muted/50 p-3 rounded-lg transition-colors"
                   >
                     <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                       <User className="h-6 w-6" />
                     </div>
                     <div className="flex-1">
                       <div className="flex items-center gap-2">
                         <div className="font-medium hover:text-accent transition-colors">
                           {vehicle.profiles?.display_name || "Anonymous User"}
                         </div>
                         {vehicle.profiles?.verified && <VerifiedBadge size="sm" />}
                       </div>
                       <div className="text-sm text-muted-foreground">
                         View Profile →
                       </div>
                     </div>
                   </Link>
                 </Card>

                 {/* Recent Bids - Latest 3 */}
                 <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Recent Bids</h2>
                    {bids.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBidHistory(true)}
                      >
                        View All
                      </Button>
                    )}
                  </div>
                  {bids.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">No bids yet</p>
                  ) : (
                    <div className="space-y-3">
                      {bids.map((bid, index) => (
                        <div key={bid.id} className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <Link
                                    to={`/user/${bid.bidder_id}`}
                                    className="truncate text-sm font-medium hover:text-accent transition-colors hover:underline block"
                                  >
                                    {bid.profiles?.display_name || "Anonymous"}
                                  </Link>
                                  {bid.profiles?.verified && <VerifiedBadge size="sm" />}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(bid.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0">
                              {index === 0 && (
                                <Badge variant="outline" className="mb-1 bg-accent/10 text-xs">
                                  High
                                </Badge>
                              )}
                              <span className="text-sm font-bold text-bid-active whitespace-nowrap">
                                ${bid.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {index < bids.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BidHistoryModal 
        vehicleId={vehicle.id} 
        isOpen={showBidHistory} 
        onClose={() => setShowBidHistory(false)} 
      />
    </div>
  );
};

export default VehicleDetail;
