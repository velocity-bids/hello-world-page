import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { UserProfile } from "@/types";

interface SellerCardProps {
  sellerId: string;
  profile?: UserProfile | null;
}

export const SellerCard = ({ sellerId, profile }: SellerCardProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Seller</h2>
      <Link
        to={`/user/${sellerId}`}
        className="flex items-center gap-3 hover:bg-muted/50 p-3 rounded-lg transition-colors"
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium hover:text-accent transition-colors">
              {profile?.display_name || "Anonymous User"}
            </div>
            {profile?.verified && <VerifiedBadge size="sm" />}
          </div>
          <div className="text-sm text-muted-foreground">View Profile →</div>
        </div>
      </Link>
    </Card>
  );
};
