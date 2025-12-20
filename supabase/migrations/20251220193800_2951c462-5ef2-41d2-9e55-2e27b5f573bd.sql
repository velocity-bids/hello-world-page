-- Update place_bid function to prevent bids on unapproved vehicles and by admins
CREATE OR REPLACE FUNCTION public.place_bid(p_vehicle_id uuid, p_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_current_bid NUMERIC;
  v_starting_bid NUMERIC;
  v_approval_status TEXT;
  v_bid_id UUID;
BEGIN
  -- Check if user is an admin
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Administrators cannot place bids');
  END IF;

  -- Get current bid, starting bid, and approval status
  SELECT current_bid, COALESCE(starting_bid, 0), approval_status 
  INTO v_current_bid, v_starting_bid, v_approval_status
  FROM vehicles
  WHERE id = p_vehicle_id;

  -- Check if vehicle is approved
  IF v_approval_status IS NULL OR v_approval_status != 'approved' THEN
    RETURN json_build_object('error', 'This vehicle has not been approved for bidding');
  END IF;

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