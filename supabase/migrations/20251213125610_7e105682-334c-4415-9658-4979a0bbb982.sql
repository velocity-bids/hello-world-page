-- Add a policy to allow reading public profile fields for any user via the view
-- This is needed because the view uses SECURITY INVOKER
CREATE POLICY "Anyone can view public profile fields"
ON public.profiles
FOR SELECT
USING (true);

-- But we need to drop the restrictive policy first since it conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;