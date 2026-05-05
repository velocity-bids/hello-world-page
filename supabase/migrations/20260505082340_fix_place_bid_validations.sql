-- Fix: restore all bid validations lost in 20251213/20251220 rewrites.
-- The final rewrite kept the admin check and approval_status check but silently
-- dropped: self-bid prevention, auction status check, and auction_end_time check.
-- This restores all validations in the correct order using a row-level lock.

CREATE OR REPLACE FUNCTION public.place_bid(p_vehicle_id uuid, p_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_vehicle vehicles;
  v_bid_id  UUID;
BEGIN
  -- Admins cannot bid
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Administrators cannot place bids');
  END IF;

  -- Lock the row to prevent concurrent bid races
  SELECT * INTO v_vehicle
  FROM vehicles
  WHERE id = p_vehicle_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Vehicle not found');
  END IF;

  -- Seller cannot bid on their own listing
  IF v_vehicle.seller_id = auth.uid() THEN
    RETURN json_build_object('error', 'Cannot bid on your own listing');
  END IF;

  -- Vehicle must be approved
  IF v_vehicle.approval_status IS DISTINCT FROM 'approved' THEN
    RETURN json_build_object('error', 'This vehicle has not been approved for bidding');
  END IF;

  -- Auction must be active
  IF v_vehicle.status != 'active' THEN
    RETURN json_build_object('error', 'Auction is not active');
  END IF;

  -- Auction must not have expired
  IF v_vehicle.auction_end_time < now() THEN
    RETURN json_build_object('error', 'Auction has ended');
  END IF;

  -- First bid must meet starting_bid; subsequent bids must beat current_bid
  IF v_vehicle.current_bid = 0 OR v_vehicle.current_bid IS NULL THEN
    IF p_amount < COALESCE(v_vehicle.starting_bid, 0) THEN
      RETURN json_build_object(
        'error', 'Bid must be at least the starting bid of $' || COALESCE(v_vehicle.starting_bid, 0)
      );
    END IF;
  ELSE
    IF p_amount <= v_vehicle.current_bid THEN
      RETURN json_build_object(
        'error', 'Bid must be higher than current bid of $' || v_vehicle.current_bid
      );
    END IF;
  END IF;

  INSERT INTO bids (vehicle_id, bidder_id, amount)
  VALUES (p_vehicle_id, auth.uid(), p_amount)
  RETURNING id INTO v_bid_id;

  UPDATE vehicles
  SET current_bid = p_amount,
      bid_count   = bid_count + 1
  WHERE id = p_vehicle_id;

  RETURN json_build_object('success', true, 'bid_id', v_bid_id);
END;
$function$;
