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