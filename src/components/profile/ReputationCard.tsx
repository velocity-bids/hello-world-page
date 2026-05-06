import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ReputationCardProps {
  rating: number | null;
  totalFeedback: number;
}

export const ReputationCard = ({ rating, totalFeedback }: ReputationCardProps) => {
  const { t } = useTranslation();
  const displayRating = rating || 0;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("translation:profile.reputation")}</CardTitle>
        <CardDescription>{t("translation:profile.basedOnReviews", { count: totalFeedback })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 ${
                  star <= fullStars
                    ? "fill-yellow-500 text-yellow-500"
                    : star === fullStars + 1 && hasHalfStar
                      ? "fill-yellow-500/50 text-yellow-500"
                      : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-2xl font-bold">
            {displayRating > 0 ? displayRating.toFixed(1) : t("translation:profile.noRatingsYet")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
