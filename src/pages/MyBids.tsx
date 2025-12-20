import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { BasePage } from "@/components/BasePage";
import { BidCard } from "@/components/BidCard";
import { BidFilters } from "@/components/BidFilters";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/common";
import { getBidsByUser } from "@/db/queries";
import { Gavel } from "lucide-react";
import type { BidWithVehicle } from "@/types";

const MyBids = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { openLoginModal } = useAuthModal();
  const [bids, setBids] = useState<BidWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    if (!authLoading && !user) {
      openLoginModal();
      return;
    }

    if (!user) return;

    const fetchMyBids = async () => {
      const { data, error } = await getBidsByUser(user.id);

      if (error) {
        console.error("Error fetching bids:", error);
      } else {
        setBids(data);
      }
      setLoading(false);
    };

    fetchMyBids();
  }, [user, authLoading, openLoginModal, navigate]);

  const getFilteredAndSortedBids = () => {
    let filtered = [...bids];

    if (statusFilter !== "all") {
      filtered = filtered.filter((bid) => {
        const isWinning = bid.amount === bid.vehicle.current_bid;
        const isEnded = new Date(bid.vehicle.auction_end_time) < new Date();

        switch (statusFilter) {
          case "leading": return !isEnded && isWinning;
          case "outbid": return !isEnded && !isWinning;
          case "won": return isEnded && isWinning;
          case "lost": return isEnded && !isWinning;
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "ending-soon":
          return new Date(a.vehicle.auction_end_time).getTime() - new Date(b.vehicle.auction_end_time).getTime();
        case "highest-bid":
          return b.amount - a.amount;
        case "lowest-bid":
          return a.amount - b.amount;
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  };

  if (authLoading || loading) {
    return (
      <BasePage>
        <div className="container mx-auto px-4 py-8">
          <PageLoader message="Loading your bids..." />
        </div>
      </BasePage>
    );
  }

  const filteredBids = getFilteredAndSortedBids();

  return (
    <BasePage>
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-hero border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-2">
              <Gavel className="w-8 h-8 text-primary-foreground" />
              <h1 className="text-4xl font-bold text-primary-foreground">My Bids</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Track your auction activity and manage your bids
            </p>
          </div>
        </div>

        {bids.length > 0 && (
          <BidFilters
            statusFilter={statusFilter}
            sortBy={sortBy}
            onStatusFilterChange={setStatusFilter}
            onSortByChange={setSortBy}
            totalBids={filteredBids.length}
          />
        )}

        <div className="container mx-auto px-4 py-8">
          {bids.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="No bids placed yet"
              description="Start bidding on auctions to see your activity here. Browse our current listings to find your next vehicle."
              action={{ label: "Browse Auctions", onClick: () => navigate("/auctions") }}
            />
          ) : filteredBids.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="No matching bids"
              description="No bids match your current filters"
            >
              <Button variant="outline" onClick={() => { setStatusFilter("all"); setSortBy("recent"); }}>
                Clear Filters
              </Button>
            </EmptyState>
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
