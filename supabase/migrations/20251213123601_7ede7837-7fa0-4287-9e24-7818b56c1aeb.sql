-- Add starting_bid column to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS starting_bid numeric DEFAULT 0;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create reports table for reporting suspicious auctions
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL CHECK (reason IN ('fraudulent', 'inappropriate', 'duplicate', 'misleading', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'resolved')),
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id OR has_role(auth.uid(), 'admin'));

-- Admins can update reports
CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
ON public.reports FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update place_bid function to validate against starting_bid
CREATE OR REPLACE FUNCTION public.place_bid(p_vehicle_id uuid, p_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_current_bid NUMERIC;
  v_starting_bid NUMERIC;
  v_bid_id UUID;
BEGIN
  -- Get current bid and starting bid
  SELECT current_bid, COALESCE(starting_bid, 0) INTO v_current_bid, v_starting_bid
  FROM vehicles
  WHERE id = p_vehicle_id;

  -- If no bids yet, validate against starting bid
  IF v_current_bid = 0 OR v_current_bid IS NULL THEN
    IF p_amount < v_starting_bid THEN
      RETURN json_build_object('error', 'Bid must be at least the starting bid of $' || v_starting_bid);
    END IF;
  ELSE
    -- Validate bid amount is higher than current bid
    IF p_amount <= v_current_bid THEN
      RETURN json_build_object('error', 'Bid must be higher than current bid');
    END IF;
  END IF;

  -- Insert bid
  INSERT INTO bids (vehicle_id, bidder_id, amount)
  VALUES (p_vehicle_id, auth.uid(), p_amount)
  RETURNING id INTO v_bid_id;

  -- Update vehicle
  UPDATE vehicles
  SET current_bid = p_amount,
      bid_count = bid_count + 1
  WHERE id = p_vehicle_id;

  RETURN json_build_object('success', true, 'bid_id', v_bid_id);
END;
$function$;