import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ReputationCardProps {
  rating: number | null;
  totalFeedback: number;
}

export const ReputationCard = ({ rating, totalFeedback }: ReputationCardProps) => {
  const displayRating = rating || 0;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reputation</CardTitle>
        <CardDescription>Based on {totalFeedback} review{totalFeedback !== 1 ? 's' : ''}</CardDescription>
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
            {displayRating > 0 ? displayRating.toFixed(1) : "No ratings yet"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
