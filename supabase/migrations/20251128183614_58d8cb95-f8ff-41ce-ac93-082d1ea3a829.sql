-- Add verified field to profiles
ALTER TABLE public.profiles ADD COLUMN verified boolean DEFAULT false;

-- Create function to update verified status based on criteria
CREATE OR REPLACE FUNCTION public.update_seller_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set verified to true if seller has:
  -- - At least 5 completed sales AND
  -- - Rating of 4.5 or higher
  UPDATE public.profiles
  SET verified = (
    COALESCE(vehicles_sold, 0) >= 5 AND
    COALESCE(rating, 0) >= 4.5
  )
  WHERE user_id = COALESCE(NEW.reviewee_id, NEW.user_id, OLD.reviewee_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Trigger on feedback changes (affects rating)
CREATE TRIGGER update_verification_on_feedback
AFTER INSERT OR UPDATE OR DELETE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_verification();

-- Trigger on profile changes (affects vehicles_sold)
CREATE TRIGGER update_verification_on_profile
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.vehicles_sold IS DISTINCT FROM NEW.vehicles_sold OR OLD.rating IS DISTINCT FROM NEW.rating)
EXECUTE FUNCTION public.update_seller_verification();

-- Update verification status for all existing users
UPDATE public.profiles
SET verified = (
  COALESCE(vehicles_sold, 0) >= 5 AND
  COALESCE(rating, 0) >= 4.5
);