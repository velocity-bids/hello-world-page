import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/common";
import { useTranslation } from "react-i18next";
import type { UserProfile } from "@/types";

interface SellerCardProps {
  sellerId: string;
  profile?: UserProfile | null;
}

export const SellerCard = ({ sellerId, profile }: SellerCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{t("translation:vehicle.seller")}</h2>
      <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <UserAvatar
          userId={sellerId}
          displayName={profile?.display_name}
          verified={profile?.verified}
          avatarUrl={profile?.avatar_url}
          size="lg"
          linkToProfile
          subtitle={t("translation:vehicle.viewProfileLink")}
        />
      </div>
    </Card>
  );
};
