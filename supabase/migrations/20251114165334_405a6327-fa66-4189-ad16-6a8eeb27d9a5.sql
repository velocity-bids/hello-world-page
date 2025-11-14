-- Create watched_vehicles table
CREATE TABLE public.watched_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  notify_on_sale BOOLEAN NOT NULL DEFAULT true,
  notify_on_bid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

-- Enable RLS
ALTER TABLE public.watched_vehicles ENABLE ROW LEVEL SECURITY;

-- Users can view their own watched vehicles
CREATE POLICY "Users can view their own watched vehicles"
ON public.watched_vehicles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add vehicles to their watchlist
CREATE POLICY "Users can add vehicles to watchlist"
ON public.watched_vehicles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove vehicles from their watchlist
CREATE POLICY "Users can remove from watchlist"
ON public.watched_vehicles
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their notification preferences
CREATE POLICY "Users can update their own watch preferences"
ON public.watched_vehicles
FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_watched_vehicles_user_id ON public.watched_vehicles(user_id);
CREATE INDEX idx_watched_vehicles_vehicle_id ON public.watched_vehicles(vehicle_id);

-- Enable realtime for watched_vehicles
ALTER PUBLICATION supabase_realtime ADD TABLE public.watched_vehicles;