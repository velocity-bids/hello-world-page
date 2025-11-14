-- Create vehicles table for auction listings
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  vin TEXT,
  description TEXT,
  image_url TEXT,
  reserve_price NUMERIC(10, 2),
  current_bid NUMERIC(10, 2) DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  auction_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bids table for tracking all bids
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "Vehicles are viewable by everyone"
  ON public.vehicles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own vehicles"
  ON public.vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- RLS Policies for bids
CREATE POLICY "Bids are viewable by everyone"
  ON public.bids
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create bids"
  ON public.bids
  FOR INSERT
  WITH CHECK (auth.uid() = bidder_id);

-- Trigger for updated_at on vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new bids
CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update vehicle with new bid amount and increment bid count
  UPDATE public.vehicles
  SET 
    current_bid = NEW.amount,
    bid_count = bid_count + 1,
    updated_at = now()
  WHERE id = NEW.vehicle_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update vehicle when new bid is placed
CREATE TRIGGER on_new_bid
  AFTER INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_bid();

-- Enable realtime for vehicles and bids tables
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER TABLE public.bids REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;