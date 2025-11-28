import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Bid {
  id: string;
  amount: number;
  created_at: string;
  bidder_id: string;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface BidHistoryModalProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BidHistoryModal = ({ vehicleId, isOpen, onClose }: BidHistoryModalProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !vehicleId) return;

    const fetchAllBids = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("amount", { ascending: false });

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching bids:", error);
        }
        toast.error("Failed to load bid history");
        setLoading(false);
        return;
      }

      // Fetch public profiles for each bid
      const bidsWithProfiles = await Promise.all(
        (data || []).map(async (bid) => {
          const { data: profileData } = await supabase
            .from("public_profiles")
            .select("display_name")
            .eq("user_id", bid.bidder_id)
            .maybeSingle();

          return {
            ...bid,
            profiles: profileData,
          };
        })
      );

      setBids(bidsWithProfiles);
      setLoading(false);
    };

    fetchAllBids();
  }, [isOpen, vehicleId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Full Bid History</DialogTitle>
          <DialogDescription>
            Complete history of all bids placed on this auction
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : bids.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No bids yet
            </div>
          ) : (
            <div className="space-y-3">
              {bids.map((bid, index) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/user/${bid.bidder_id}`}
                          className="truncate font-medium hover:text-accent transition-colors hover:underline"
                        >
                          {bid.profiles?.display_name || "Anonymous"}
                        </Link>
                        {index === 0 && (
                          <Badge variant="outline" className="bg-accent/10">
                            Highest
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(bid.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-bid-active">
                      ${bid.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Bid #{bids.length - index}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
