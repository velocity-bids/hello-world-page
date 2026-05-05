-- ============================================
-- 20251114150236_b2266b0e (BASE — run first)
-- ============================================
-- Create app_role enum
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  address TEXT,
  date_of_birth TEXT,
  id_document_url TEXT,
  rating NUMERIC,
  vehicles_sold INTEGER DEFAULT 0,
  member_since TEXT NOT NULL DEFAULT NOW()::TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  vin TEXT,
  description TEXT,
  image_url TEXT,
  images TEXT[],
  current_bid NUMERIC DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  reserve_price NUMERIC,
  auction_end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  approval_status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Vehicles RLS policies
CREATE POLICY "Anyone can view active vehicles"
  ON public.vehicles FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Bids RLS policies
CREATE POLICY "Anyone can view bids"
  ON public.bids FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can place bids"
  ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = bidder_id);

-- Create public_profiles view
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

-- Create place_bid function
CREATE OR REPLACE FUNCTION public.place_bid(p_vehicle_id UUID, p_amount NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_bid NUMERIC;
  v_bid_id UUID;
BEGIN
  -- Get current bid
  SELECT current_bid INTO v_current_bid
  FROM vehicles
  WHERE id = p_vehicle_id;

  -- Validate bid amount
  IF p_amount <= v_current_bid THEN
    RETURN json_build_object('error', 'Bid must be higher than current bid');
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
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 20251108165006_04bf2909-2e47-4a8d-a1b2-6839035fc6f0.sql
-- ============================================
-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true);

-- Create policy for uploading vehicle images
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for viewing vehicle images
CREATE POLICY "Anyone can view vehicle images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

-- Create policy for deleting own vehicle images
CREATE POLICY "Users can delete their own vehicle images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add images column to vehicles table to support multiple images
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Update image_url to be optional since we'll use images array
ALTER TABLE public.vehicles
ALTER COLUMN image_url DROP NOT NULL;
-- ============================================
-- 20251110120119_f3ae7874-7cf8-4c21-8780-31e5f61afd52.sql
-- ============================================
-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS id_document_url text,
ADD COLUMN IF NOT EXISTS address text;

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false);

-- RLS policies for id-documents bucket
CREATE POLICY "Users can upload their own ID documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own ID documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own ID documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own ID documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- ============================================
-- 20251111121144_bf1f4c19-86a2-4759-9823-db565810ab31.sql
-- ============================================
-- Update handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, date_of_birth, address)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data->>'date_of_birth')::date,
    NEW.raw_user_meta_data->>'address'
  );
  RETURN NEW;
END;
$$;
-- ============================================
-- 20251111121817_bc2ba06b-47a4-4643-8f41-94acad9a2b68.sql
-- ============================================
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
-- ============================================
-- 20251111122026_871dfc77-e25d-41ed-bc9d-af688f62d8b7.sql
-- ============================================
-- Fix the public_profiles view to not be SECURITY DEFINER
-- Drop and recreate as a regular view
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
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
-- ============================================
-- 20251114152301_9aa2dff1-9248-4dc9-b11f-d45ec3c7c4b0.sql
-- ============================================
-- Update the handle_new_user function to include all metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert into profiles with all metadata
  INSERT INTO public.profiles (user_id, display_name, date_of_birth, address)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'date_of_birth',
    NEW.raw_user_meta_data->>'address'
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
-- ============================================
-- 20251114152356_2e7506b5-94a8-40eb-9865-4683b15083a9.sql
-- ============================================
-- Fix search_path security issue by using explicit schema reference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Insert into profiles with all metadata
  INSERT INTO public.profiles (user_id, display_name, date_of_birth, address)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'date_of_birth',
    NEW.raw_user_meta_data->>'address'
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
-- ============================================
-- 20251114153249_91a274a7-741e-40f2-8d2f-ac07b58b8f9a.sql
-- ============================================
-- Create comments table for vehicle listings
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view comments
CREATE POLICY "Anyone can view comments"
ON public.comments
FOR SELECT
USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
-- ============================================
-- 20251114165334_405a6327-fa66-4189-ad16-6a8eeb27d9a5.sql
-- ============================================
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
-- ============================================
-- 20251125134759_5bc613a9-8ab0-485e-bb24-ef5507cb64d2.sql
-- ============================================
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
-- ============================================
-- 20251125134815_c7009c61-b153-42f6-ad16-f4a93ecca246.sql
-- ============================================
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
-- ============================================
-- 20251125134826_73410084-bf66-4369-8a69-9f3904139a00.sql
-- ============================================
-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
-- ============================================
-- 20251125151020_01e4f995-b037-4684-ba3a-ed68ee5ddab5.sql
-- ============================================
-- Add new vehicle specification columns
ALTER TABLE vehicles
ADD COLUMN horsepower INTEGER,
ADD COLUMN engine_type TEXT,
ADD COLUMN exterior_color TEXT,
ADD COLUMN interior_color TEXT,
ADD COLUMN engine_displacement INTEGER,
ADD COLUMN fuel_type TEXT,
ADD COLUMN transmission TEXT,
ADD COLUMN doors INTEGER;
-- ============================================
-- 20251125151547_c64a5a9f-3cbc-46fd-825f-92ea3a9abb56.sql
-- ============================================
-- Add new vehicle history and condition columns
ALTER TABLE vehicles
ADD COLUMN imported BOOLEAN DEFAULT false,
ADD COLUMN import_country TEXT,
ADD COLUMN maintenance_book BOOLEAN DEFAULT false,
ADD COLUMN smoker BOOLEAN DEFAULT false,
ADD COLUMN number_of_owners INTEGER;
-- ============================================
-- 20251128170959_dab2258d-1cb2-4ce8-8765-9ea8cb9100f2.sql
-- ============================================
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
-- ============================================
-- 20251128183614_58d8cb95-f8ff-41ce-ac93-082d1ea3a829.sql
-- ============================================
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
-- ============================================
-- 20251128183735_d219c3d6-63e3-409a-9bd7-0eac47cfa0ec.sql
-- ============================================
-- Drop and recreate public_profiles view with verified field
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  member_since,
  rating,
  vehicles_sold,
  verified,
  created_at
FROM public.profiles;
-- ============================================
-- 20251213123601_7ede7837-7fa0-4287-9e24-7818b56c1aeb.sql
-- ============================================
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
-- ============================================
-- 20251213125147_932a9467-cbd3-4a0b-a3f9-222c82bd4036.sql
-- ============================================
-- Allow sellers to delete their own vehicles (only if no bids placed)
CREATE POLICY "Sellers can delete their own vehicles"
ON public.vehicles
FOR DELETE
USING (auth.uid() = seller_id AND (bid_count IS NULL OR bid_count = 0));
-- ============================================
-- 20251213125530_3fc46f11-9fd3-40d7-936d-13bb9a54714d.sql
-- ============================================
-- Fix 1: Drop the existing public_profiles view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view with SECURITY INVOKER (the default, explicitly stated)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS SELECT 
    id,
    user_id,
    display_name,
    avatar_url,
    member_since,
    rating,
    vehicles_sold,
    verified,
    created_at
FROM profiles;

-- Fix 2: Update the profiles RLS policy to restrict SELECT to own profile only
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restrictive policy: users can only view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);
-- ============================================
-- 20251213125610_7e105682-334c-4415-9658-4979a0bbb982.sql
-- ============================================
-- Add a policy to allow reading public profile fields for any user via the view
-- This is needed because the view uses SECURITY INVOKER
CREATE POLICY "Anyone can view public profile fields"
ON public.profiles
FOR SELECT
USING (true);

-- But we need to drop the restrictive policy first since it conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- ============================================
-- 20251213125628_3c08e5a6-1e9c-4b19-80ba-ee276305c467.sql
-- ============================================
-- Drop the overly permissive policy we just created
DROP POLICY IF EXISTS "Anyone can view public profile fields" ON public.profiles;

-- Create restrictive policy: users can only view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Create a security definer function to get public profile data safely
-- This bypasses RLS but only returns safe columns
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  member_since text,
  rating numeric,
  vehicles_sold integer,
  verified boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    display_name,
    avatar_url,
    member_since,
    rating,
    vehicles_sold,
    verified,
    created_at
  FROM public.profiles
  WHERE profiles.user_id = p_user_id
$$;

-- Create a security definer function to get multiple public profiles
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  member_since text,
  rating numeric,
  vehicles_sold integer,
  verified boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    display_name,
    avatar_url,
    member_since,
    rating,
    vehicles_sold,
    verified,
    created_at
  FROM public.profiles
  WHERE profiles.user_id = ANY(p_user_ids)
$$;

-- Drop the security invoker view since we're using functions now
DROP VIEW IF EXISTS public.public_profiles;
-- ============================================
-- 20251220192227_0e436707-2c0c-40e3-872b-d7e476cf389a.sql
-- ============================================
-- Drop and recreate the handle_new_user function to handle null/empty date_of_birth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, date_of_birth, address)
  VALUES (
    NEW.id, 
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth', ''),
    NULLIF(NEW.raw_user_meta_data->>'address', '')
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
-- ============================================
-- 20251220193800_2951c462-5ef2-41d2-9e55-2e27b5f573bd.sql
-- ============================================
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
-- ============================================
-- 20260102203131_59af9770-7125-46ba-8f94-0849cba77ac1.sql
-- ============================================
-- Drop the old check constraint and add the updated one with new_listing_submitted type
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['new_bid'::text, 'auction_ending'::text, 'auction_ended'::text, 'new_listing_submitted'::text]));
-- ============================================
-- 20260504160208_add_unique_user_id_to_user_roles.sql
-- ============================================
-- Bug 8 fix: add UNIQUE constraint on user_roles.user_id
-- Required for the upsert in setUserRole (mutations/user-roles.ts) to work correctly.
-- Without this constraint, ON CONFLICT (user_id) has nothing to target and falls back
-- to a plain INSERT, which can create duplicate role rows for the same user.
--
-- Before adding the constraint, deduplicate any existing rows by keeping only the
-- most recent role entry per user.

DELETE FROM public.user_roles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_roles
  ORDER BY user_id, created_at DESC
);

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- ============================================
-- 20260505082340_fix_place_bid_validations.sql
-- ============================================
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

-- ============================================
-- 20260505082341_fix_profile_column_types.sql
-- ============================================
-- Fix: profiles.member_since and profiles.date_of_birth were changed from proper
-- temporal types to TEXT in the 20251114 reset migration. This restores them to
-- TIMESTAMPTZ and DATE respectively, which is required for correct date handling,
-- sorting, timezone conversion, and age validation.
--
-- The USING clause safely casts existing text data. Empty strings become NULL.

-- member_since: TEXT → TIMESTAMPTZ
-- Must drop the text default first; Postgres can't auto-cast it during type change
ALTER TABLE public.profiles
  ALTER COLUMN member_since DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN member_since TYPE TIMESTAMPTZ
  USING NULLIF(member_since, '')::TIMESTAMPTZ;

ALTER TABLE public.profiles
  ALTER COLUMN member_since SET DEFAULT NOW();

-- date_of_birth: TEXT → DATE
ALTER TABLE public.profiles
  ALTER COLUMN date_of_birth TYPE DATE
  USING NULLIF(date_of_birth, '')::DATE;

-- Drop first since return type is changing (member_since text → timestamptz)
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);

-- Update get_public_profile function to return TIMESTAMPTZ for member_since
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  id            uuid,
  user_id       uuid,
  display_name  text,
  avatar_url    text,
  member_since  timestamptz,
  rating        numeric,
  vehicles_sold integer,
  verified      boolean,
  created_at    timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    user_id,
    display_name,
    avatar_url,
    member_since,
    rating,
    vehicles_sold,
    verified,
    created_at
  FROM public.profiles
  WHERE profiles.user_id = p_user_id;
$$;

-- Update get_public_profiles (bulk) to return TIMESTAMPTZ for member_since
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE (
  id            uuid,
  user_id       uuid,
  display_name  text,
  avatar_url    text,
  member_since  timestamptz,
  rating        numeric,
  vehicles_sold integer,
  verified      boolean,
  created_at    timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    user_id,
    display_name,
    avatar_url,
    member_since,
    rating,
    vehicles_sold,
    verified,
    created_at
  FROM public.profiles
  WHERE profiles.user_id = ANY(p_user_ids);
$$;

-- Update handle_new_user to write DATE (not raw text) for date_of_birth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, date_of_birth, address)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'address', '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- ============================================
-- 20260505082342_fix_vehicle_check_constraints.sql
-- ============================================
-- Fix: vehicles.status and vehicles.approval_status had CHECK constraints in the
-- original migrations but they were dropped in the 20251114 reset. Without them,
-- any arbitrary string is a valid status, making RLS policies and application
-- logic based on these fields unreliable.

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_status_check
  CHECK (status IN ('active', 'ended', 'sold'));

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'declined'));

-- ============================================
-- 20260505082343_fix_missing_foreign_keys.sql
-- ============================================
-- Fix: the 20251114 reset migration recreated vehicles, bids, user_roles,
-- comments, notifications, and reports without foreign key references to
-- auth.users. Without FKs, deleting a user leaves orphaned rows across all
-- these tables with no automatic cleanup.
--
-- ON DELETE CASCADE means all related rows are removed when the user is deleted.
-- Skipped if constraint already exists (safe to re-run).

DO $$
BEGIN
  -- vehicles.seller_id → auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicles_seller_id_fkey'
      AND table_name = 'vehicles'
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT vehicles_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- bids.bidder_id → auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bids_bidder_id_fkey'
      AND table_name = 'bids'
  ) THEN
    ALTER TABLE public.bids
      ADD CONSTRAINT bids_bidder_id_fkey
      FOREIGN KEY (bidder_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- user_roles.user_id → auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_roles_user_id_fkey'
      AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- comments.user_id → auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'comments_user_id_fkey'
      AND table_name = 'comments'
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- notifications.user_id → auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_user_id_fkey'
      AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- notifications.vehicle_id → vehicles (already nullable after schema review)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_vehicle_id_fkey'
      AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
  END IF;

  -- reports.reporter_id → auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_reporter_id_fkey'
      AND table_name = 'reports'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_reporter_id_fkey
      FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
