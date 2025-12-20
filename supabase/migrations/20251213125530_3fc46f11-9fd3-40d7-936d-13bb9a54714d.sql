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