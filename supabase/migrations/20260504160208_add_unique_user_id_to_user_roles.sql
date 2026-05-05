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
