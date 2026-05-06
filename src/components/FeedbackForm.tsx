import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle } from "lucide-react";
import { checkExistingFeedback } from "@/db/queries";
import { createFeedback } from "@/db/mutations";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
  vehicleId: string;
  sellerId: string;
  winningBidderId: string | null;
}

export const FeedbackForm = ({ vehicleId, sellerId, winningBidderId }: FeedbackFormProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const isSeller = user?.id === sellerId;
  const isWinner = user?.id === winningBidderId;
  const canLeaveFeedback = (isSeller && winningBidderId) || isWinner;
  const revieweeId = isSeller ? winningBidderId : sellerId;

  useEffect(() => {
    const checkFeedback = async () => {
      if (!user || !revieweeId) {
        setLoading(false);
        return;
      }

      const { data } = await checkExistingFeedback(user.id, revieweeId, vehicleId);
      setExistingFeedback(!!data);
      setLoading(false);
    };

    checkFeedback();
  }, [user, revieweeId, vehicleId]);

  const handleSubmit = async () => {
    if (!user || !revieweeId || rating === 0) {
      toast.error(t("translation:feedback.selectRating"));
      return;
    }

    setSubmitting(true);

    const { error } = await createFeedback({
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      vehicle_id: vehicleId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      console.error("Error submitting feedback:", error);
      toast.error(t("translation:feedback.submitFailed"));
    } else {
      toast.success(t("translation:feedback.submitted"));
      setExistingFeedback(true);
    }

    setSubmitting(false);
  };

  if (loading || !canLeaveFeedback) return null;

  if (existingFeedback) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span>{t("translation:feedback.alreadyLeft")}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">
        {isSeller ? t("translation:feedback.leaveFeedbackForBuyer") : t("translation:feedback.leaveFeedbackForSeller")}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {isSeller ? t("translation:feedback.shareExperienceBuyer") : t("translation:feedback.shareExperienceSeller")}
      </p>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">{t("translation:feedback.rating")}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={t("translation:feedback.rating")}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="feedback-comment" className="mb-2 block text-sm font-medium">
          {t("translation:feedback.commentOptional")}
        </label>
        <Textarea
          id="feedback-comment"
          placeholder={t("translation:feedback.commentPlaceholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("translation:feedback.characters", { count: comment.length })}</p>
      </div>

      <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full">
        {submitting ? t("translation:feedback.submitting") : t("translation:feedback.submitFeedback")}
      </Button>
    </Card>
  );
};
