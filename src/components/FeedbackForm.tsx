import { useState, useEffect } from "react";
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
      toast.error("Please select a rating");
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
      toast.error("Failed to submit feedback");
    } else {
      toast.success("Feedback submitted successfully!");
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
          <span>You've already left feedback for this transaction</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Leave Feedback for {isSeller ? "Buyer" : "Seller"}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Share your experience with this {isSeller ? "buyer" : "seller"} to help the community.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="feedback-comment" className="block text-sm font-medium mb-2">
          Comment (optional)
        </label>
        <Textarea
          id="feedback-comment"
          placeholder="Share details about your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">{comment.length}/500 characters</p>
      </div>

      <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full">
        {submitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </Card>
  );
};
