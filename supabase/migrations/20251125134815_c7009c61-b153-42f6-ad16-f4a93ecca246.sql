-- Fix search_path for notify_watched_vehicle_bid function
CREATE OR REPLACE FUNCTION public.notify_watched_vehicle_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Create notifications for users watching this vehicle
  INSERT INTO public.notifications (user_id, vehicle_id, type, message, metadata)
  SELECT 
    wv.user_id,
    NEW.vehicle_id,
    'new_bid',
    'New bid of $' || NEW.amount || ' placed on ' || v.year || ' ' || v.make || ' ' || v.model,
    jsonb_build_object('bid_amount', NEW.amount, 'vehicle_make', v.make, 'vehicle_model', v.model)
  FROM watched_vehicles wv
  JOIN vehicles v ON v.id = NEW.vehicle_id
  WHERE wv.vehicle_id = NEW.vehicle_id
    AND wv.notify_on_bid = true
    AND wv.user_id != NEW.bidder_id; -- Don't notify the bidder themselves
  
  RETURN NEW;
END;
$$;