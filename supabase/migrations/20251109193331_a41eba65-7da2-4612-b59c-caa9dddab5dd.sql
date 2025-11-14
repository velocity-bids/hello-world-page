-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add approval_status column to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'declined'));

-- Add admin notes column for decline reasons
ALTER TABLE public.vehicles 
ADD COLUMN admin_notes TEXT;

-- Update existing vehicles to be approved
UPDATE public.vehicles SET approval_status = 'approved';

-- Update RLS policy for viewing vehicles - only approved ones are public
DROP POLICY IF EXISTS "Vehicles are viewable by everyone" ON public.vehicles;

CREATE POLICY "Approved vehicles are viewable by everyone"
ON public.vehicles
FOR SELECT
USING (
  approval_status = 'approved' 
  OR auth.uid() = seller_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Policy for admins to update vehicle approval status
CREATE POLICY "Admins can update vehicle approval status"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));