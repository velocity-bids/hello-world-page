-- Fix 1: Create public profile view with only non-sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  rating,
  vehicles_sold,
  member_since,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Fix 2: Update profiles RLS policies to restrict sensitive data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Update bids RLS policies to restrict access
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.bids;

CREATE POLICY "Users can view their own bids"
ON public.bids FOR SELECT
USING (auth.uid() = bidder_id);

CREATE POLICY "Sellers can view bids on their vehicles"
ON public.bids FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE vehicles.id = bids.vehicle_id
    AND vehicles.seller_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all bids"
ON public.bids FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 4: Create server-side bid validation function
CREATE OR REPLACE FUNCTION public.place_bid(
  p_vehicle_id uuid,
  p_amount numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle vehicles;
  v_min_bid numeric;
BEGIN
  -- Get vehicle and lock row
  SELECT * INTO v_vehicle
  FROM vehicles
  WHERE id = p_vehicle_id
  FOR UPDATE;
  
  -- Check if vehicle exists
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Vehicle not found');
  END IF;
  
  -- Validate auction is active
  IF v_vehicle.status != 'active' THEN
    RETURN json_build_object('error', 'Auction is not active');
  END IF;
  
  IF v_vehicle.auction_end_time < now() THEN
    RETURN json_build_object('error', 'Auction has ended');
  END IF;
  
  -- Check approval status
  IF v_vehicle.approval_status != 'approved' THEN
    RETURN json_build_object('error', 'Vehicle is not approved for bidding');
  END IF;
  
  -- Calculate minimum bid
  v_min_bid := CASE
    WHEN v_vehicle.current_bid > 0 THEN v_vehicle.current_bid + 100
    ELSE 100
  END;
  
  -- Validate bid amount
  IF p_amount < v_min_bid THEN
    RETURN json_build_object('error', 'Bid must be at least $' || v_min_bid);
  END IF;
  
  IF p_amount <= 0 OR p_amount > 999999999 THEN
    RETURN json_build_object('error', 'Invalid bid amount');
  END IF;
  
  -- Prevent self-bidding
  IF v_vehicle.seller_id = auth.uid() THEN
    RETURN json_build_object('error', 'Cannot bid on your own listing');
  END IF;
  
  -- Insert bid
  INSERT INTO bids (vehicle_id, bidder_id, amount)
  VALUES (p_vehicle_id, auth.uid(), p_amount);
  
  RETURN json_build_object('success', true);
END;
$$;

-- Fix 5: Add database constraints for vehicle data validation
DO $$ 
BEGIN
  -- Add year constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'year_valid'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT year_valid 
    CHECK (year >= 1900 AND year <= extract(year from now()) + 1);
  END IF;

  -- Add mileage constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mileage_valid'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT mileage_valid 
    CHECK (mileage >= 0 AND mileage <= 9999999);
  END IF;

  -- Add make length constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'make_length'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT make_length 
    CHECK (char_length(make) > 0 AND char_length(make) <= 50);
  END IF;

  -- Add model length constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'model_length'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT model_length 
    CHECK (char_length(model) > 0 AND char_length(model) <= 50);
  END IF;
END $$;