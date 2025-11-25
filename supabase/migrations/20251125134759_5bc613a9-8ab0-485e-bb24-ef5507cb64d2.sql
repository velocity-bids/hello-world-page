-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_bid', 'auction_ending', 'auction_ended')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to create notification for watched vehicle bid
CREATE OR REPLACE FUNCTION public.notify_watched_vehicle_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Trigger for new bids on watched vehicles
CREATE TRIGGER notify_on_watched_bid
AFTER INSERT ON bids
FOR EACH ROW
EXECUTE FUNCTION public.notify_watched_vehicle_bid();