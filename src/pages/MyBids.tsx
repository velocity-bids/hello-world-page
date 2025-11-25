import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BasePage } from "@/components/BasePage";
import { BidCard } from "@/components/BidCard";
import { BidFilters } from "@/components/BidFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

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

  const getFilteredAndSortedBids = () => {
    let filtered = [...bids];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((bid) => {
        const isWinning = bid.amount === bid.vehicle.current_bid;
        const isEnded = new Date(bid.vehicle.auction_end_time) < new Date();

        switch (statusFilter) {
          case "leading":
            return !isEnded && isWinning;
          case "outbid":
            return !isEnded && !isWinning;
          case "won":
            return isEnded && isWinning;
          case "lost":
            return isEnded && !isWinning;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "ending-soon":
          return (
            new Date(a.vehicle.auction_end_time).getTime() -
            new Date(b.vehicle.auction_end_time).getTime()
          );
        case "highest-bid":
          return b.amount - a.amount;
        case "lowest-bid":
          return a.amount - b.amount;
        case "recent":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return filtered;
  };

  if (authLoading || loading) {
    return (
      <BasePage>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </BasePage>
    );
  }

  const filteredBids = getFilteredAndSortedBids();

  return (
    <BasePage>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-hero border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-2">
              <Gavel className="w-8 h-8 text-primary-foreground" />
              <h1 className="text-4xl font-bold text-primary-foreground">
                My Bids
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Track your auction activity and manage your bids
            </p>
          </div>
        </div>

        {/* Filters */}
        {bids.length > 0 && (
          <BidFilters
            statusFilter={statusFilter}
            sortBy={sortBy}
            onStatusFilterChange={setStatusFilter}
            onSortByChange={setSortBy}
            totalBids={filteredBids.length}
          />
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {bids.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Gavel className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No bids placed yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start bidding on auctions to see your activity here. Browse
                  our current listings to find your next vehicle.
                </p>
                <Button onClick={() => navigate("/auctions")} size="lg">
                  Browse Auctions
                </Button>
              </CardContent>
            </Card>
          ) : filteredBids.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No bids match your current filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("all");
                    setSortBy("recent");
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredBids.map((bid) => (
                <BidCard key={bid.id} bid={bid} />
              ))}
            </div>
          )}
        </div>
      </div>
    </BasePage>
  );
};

export default MyBids;
