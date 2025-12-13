import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/common";
import type { UserProfile } from "@/types";

interface SellerCardProps {
  sellerId: string;
  profile?: UserProfile | null;
}

export const SellerCard = ({ sellerId, profile }: SellerCardProps) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Seller</h2>
      <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <UserAvatar
          userId={sellerId}
          displayName={profile?.display_name}
          verified={profile?.verified}
          avatarUrl={profile?.avatar_url}
          size="lg"
          linkToProfile
          subtitle="View Profile →"
        />
      </div>
    </Card>
  );
};
