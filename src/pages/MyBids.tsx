import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BasePage } from "@/components/BasePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface BidWithVehicle {
  id: string;
  amount: number;
  created_at: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    image_url: string | null;
    current_bid: number;
    auction_end_time: string;
    status: string;
  };
}

const MyBids = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bids, setBids] = useState<BidWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!user) return;

    const fetchMyBids = async () => {
      const { data, error } = await supabase
        .from("bids")
        .select(`
          id,
          amount,
          created_at,
          vehicle:vehicles (
            id,
            make,
            model,
            year,
            image_url,
            current_bid,
            auction_end_time,
            status
          )
        `)
        .eq("bidder_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bids:", error);
      } else {
        setBids(data as any);
      }
      setLoading(false);
    };

    fetchMyBids();
  }, [user, authLoading, navigate]);

  const isWinning = (bid: BidWithVehicle) => {
    return bid.amount === bid.vehicle.current_bid;
  };

  const isAuctionEnded = (endTime: string) => {
    return new Date(endTime) < new Date();
  };

  if (authLoading || loading) {
    return (
      <BasePage>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </BasePage>
    );
  }

  return (
    <BasePage>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Bids</h1>

        {bids.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't placed any bids yet
              </p>
              <Button onClick={() => navigate("/auctions")}>
                Browse Auctions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bids.map((bid) => {
              const winning = isWinning(bid);
              const ended = isAuctionEnded(bid.vehicle.auction_end_time);

              return (
                <Card key={bid.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-[200px_1fr] gap-4">
                    <div className="aspect-video md:aspect-square overflow-hidden">
                      <img
                        src={bid.vehicle.image_url || "/placeholder.svg"}
                        alt={`${bid.vehicle.year} ${bid.vehicle.make} ${bid.vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-1">
                            {bid.vehicle.year} {bid.vehicle.make}{" "}
                            {bid.vehicle.model}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Bid placed{" "}
                            {formatDistanceToNow(new Date(bid.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {ended ? (
                            <Badge variant="secondary">Auction Ended</Badge>
                          ) : winning ? (
                            <Badge className="bg-green-500">
                              Winning Bid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Outbid</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Your Bid
                          </p>
                          <p className="text-xl font-bold">
                            ${bid.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Current Bid
                          </p>
                          <p className="text-xl font-bold">
                            ${bid.vehicle.current_bid.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {ended ? "Ended" : "Time Left"}
                          </p>
                          <p className="text-xl font-bold">
                            {ended
                              ? formatDistanceToNow(
                                  new Date(bid.vehicle.auction_end_time),
                                  { addSuffix: true }
                                )
                              : formatDistanceToNow(
                                  new Date(bid.vehicle.auction_end_time),
                                  { addSuffix: true }
                                )}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => navigate(`/vehicle/${bid.vehicle.id}`)}
                        variant="outline"
                      >
                        View Auction
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </BasePage>
  );
};

export default MyBids;
