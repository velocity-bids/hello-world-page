-- Create feedback/reviews table for user reputation
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, reviewee_id, vehicle_id)
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback
CREATE POLICY "Anyone can view feedback"
  ON public.feedback
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own feedback"
  ON public.feedback
  FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.feedback
  FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Trigger to update updated_at
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate and update user rating
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the reviewee's rating in profiles
  UPDATE public.profiles
  SET rating = (
    SELECT AVG(rating)::numeric(3,2)
    FROM public.feedback
    WHERE reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id)
  )
  WHERE user_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update user rating when feedback is added/updated/deleted
CREATE TRIGGER update_rating_on_feedback_change
  AFTER INSERT OR UPDATE OR DELETE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating();