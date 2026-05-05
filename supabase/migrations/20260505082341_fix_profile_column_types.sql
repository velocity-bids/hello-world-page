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
