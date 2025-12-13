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