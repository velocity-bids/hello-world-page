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
