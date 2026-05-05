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
