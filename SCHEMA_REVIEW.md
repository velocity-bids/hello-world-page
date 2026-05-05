# Schema Review

Analysis of the current database schema. Issues are grouped by severity.
Each entry includes the problem, reasoning, and the recommended SQL fix.

---

## 🔴 Critical — Data Integrity / Lost Validations

### 1. `place_bid` lost auction-active checks in final rewrite
**Table/Function:** `public.place_bid`

The `20251111` migration had robust checks (`status = 'active'`, `auction_end_time < now()`, self-bid prevention). The `20251213` and `20251220` rewrites kept the approval check but silently dropped the others. A user can now bid on an expired or inactive auction at the DB level.

```sql
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

  SELECT * INTO v_vehicle FROM vehicles WHERE id = p_vehicle_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Vehicle not found');
  END IF;

  -- Seller cannot bid on own listing
  IF v_vehicle.seller_id = auth.uid() THEN
    RETURN json_build_object('error', 'Cannot bid on your own listing');
  END IF;

  IF v_vehicle.approval_status IS DISTINCT FROM 'approved' THEN
    RETURN json_build_object('error', 'This vehicle has not been approved for bidding');
  END IF;

  IF v_vehicle.status != 'active' THEN
    RETURN json_build_object('error', 'Auction is not active');
  END IF;

  IF v_vehicle.auction_end_time < now() THEN
    RETURN json_build_object('error', 'Auction has ended');
  END IF;

  -- First bid must meet starting_bid; subsequent bids must beat current_bid
  IF (v_vehicle.current_bid = 0 OR v_vehicle.current_bid IS NULL) THEN
    IF p_amount < COALESCE(v_vehicle.starting_bid, 0) THEN
      RETURN json_build_object('error', 'Bid must be at least the starting bid of $' || COALESCE(v_vehicle.starting_bid, 0));
    END IF;
  ELSE
    IF p_amount <= v_vehicle.current_bid THEN
      RETURN json_build_object('error', 'Bid must be higher than current bid of $' || v_vehicle.current_bid);
    END IF;
  END IF;

  INSERT INTO bids (vehicle_id, bidder_id, amount)
  VALUES (p_vehicle_id, auth.uid(), p_amount)
  RETURNING id INTO v_bid_id;

  UPDATE vehicles
  SET current_bid = p_amount, bid_count = bid_count + 1
  WHERE id = p_vehicle_id;

  RETURN json_build_object('success', true, 'bid_id', v_bid_id);
END;
$function$;
```

---

### 2. `profiles.member_since` stored as TEXT instead of TIMESTAMPTZ
**Table:** `public.profiles`

The `20251114` reset migration changed `member_since` from `TIMESTAMP WITH TIME ZONE` to `TEXT`. Storing timestamps as text breaks sorting, age calculations, and timezone conversion. The app already suffers from this (Bug 25 — crashing on invalid date strings).

```sql
-- Step 1: convert existing data
ALTER TABLE public.profiles
  ALTER COLUMN member_since TYPE TIMESTAMPTZ
  USING member_since::TIMESTAMPTZ;

-- Step 2: fix the default (was already correct but got cast to text)
ALTER TABLE public.profiles
  ALTER COLUMN member_since SET DEFAULT NOW();
```

Also update the `get_public_profile` / `get_public_profiles` functions to return `TIMESTAMPTZ` instead of `text` for `member_since`.

---

### 3. `profiles.date_of_birth` stored as TEXT instead of DATE
**Table:** `public.profiles`

Same problem as above. The original migration correctly used `date`; the reset changed it to `TEXT`. Prevents age validation, birthday logic, and proper type checking.

```sql
ALTER TABLE public.profiles
  ALTER COLUMN date_of_birth TYPE DATE
  USING NULLIF(date_of_birth, '')::DATE;
```

Update `handle_new_user` to cast the metadata value to `DATE`:
```sql
(NULLIF(NEW.raw_user_meta_data->>'date_of_birth', ''))::date
```

---

### 4. `vehicles.status` and `vehicles.approval_status` have no CHECK constraints
**Table:** `public.vehicles`

The `20251114` reset dropped the CHECK constraints that existed in the original migrations. Any string can now be inserted into these columns, making RLS policies and application logic unreliable.

```sql
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_status_check
  CHECK (status IN ('active', 'ended', 'sold'));

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'declined'));
```

---

## 🟠 Missing Foreign Keys

### 5. Several tables missing FK references to `auth.users`
**Tables:** `vehicles`, `bids`, `user_roles`, `comments`, `notifications`, `reports`

The `20251114` reset stripped FK constraints from many columns. Without them, orphaned rows accumulate when users are deleted, and referential integrity is not enforced by the DB.

```sql
-- vehicles.seller_id
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- bids.bidder_id
ALTER TABLE public.bids
  ADD CONSTRAINT bids_bidder_id_fkey
  FOREIGN KEY (bidder_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_roles.user_id
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- comments.user_id
ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- notifications.user_id + vehicle_id
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT notifications_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;

-- reports.reporter_id
ALTER TABLE public.reports
  ADD CONSTRAINT reports_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## 🟡 Design Issues

### 6. `profiles.rating` has no default — new users start with NULL
**Table:** `public.profiles`

The original migration defaulted to `5.0`. The reset dropped that. The app treats `NULL` and `0` differently in places; new users should start with a neutral rating.

```sql
ALTER TABLE public.profiles
  ALTER COLUMN rating SET DEFAULT 5.0;

UPDATE public.profiles SET rating = 5.0 WHERE rating IS NULL;
```

---

### 7. `feedback` unique constraint doesn't prevent duplicates when `vehicle_id` is NULL
**Table:** `public.feedback`

`UNIQUE(reviewer_id, reviewee_id, vehicle_id)` — in SQL, `NULL != NULL`, so if the vehicle is deleted and `vehicle_id` becomes NULL (via `ON DELETE SET NULL`), the constraint no longer prevents a reviewer leaving multiple reviews for the same person.

```sql
-- Partial unique index: enforce uniqueness when vehicle_id is NULL
CREATE UNIQUE INDEX feedback_no_vehicle_unique
  ON public.feedback (reviewer_id, reviewee_id)
  WHERE vehicle_id IS NULL;
```

---

### 8. `vehicles_sold` is never automatically incremented
**Table:** `public.profiles`

There's no trigger to increment `vehicles_sold` when an auction ends with a winning bid. It relies on manual or edge-function updates, which can be missed.

```sql
CREATE OR REPLACE FUNCTION public.increment_vehicles_sold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Fire when auction status changes to 'ended' or 'sold'
  IF NEW.status IN ('ended', 'sold') AND OLD.status = 'active' AND NEW.bid_count > 0 THEN
    UPDATE public.profiles
    SET vehicles_sold = vehicles_sold + 1
    WHERE user_id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auction_end
  AFTER UPDATE OF status ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_vehicles_sold();
```

---

### 9. `notifications.vehicle_id` is NOT NULL — prevents non-auction notifications
**Table:** `public.notifications`

Every notification is forced to reference a vehicle. This makes it impossible to send account-level notifications (e.g. "Your identity was verified", "New message from admin") without a vehicle context.

```sql
ALTER TABLE public.notifications
  ALTER COLUMN vehicle_id DROP NOT NULL;
```

---

## 🟢 Performance — Missing Indexes

These columns are frequently used in WHERE clauses or JOINs but have no index:

```sql
-- "My listings" page
CREATE INDEX IF NOT EXISTS idx_vehicles_seller_id ON public.vehicles(seller_id);

-- Admin dashboard / approval queue
CREATE INDEX IF NOT EXISTS idx_vehicles_approval_status ON public.vehicles(approval_status);

-- Edge function that checks for ending auctions
CREATE INDEX IF NOT EXISTS idx_vehicles_auction_end_time ON public.vehicles(auction_end_time);

-- Bid history per vehicle (most common query)
CREATE INDEX IF NOT EXISTS idx_bids_vehicle_id ON public.bids(vehicle_id);

-- "My bids" page
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON public.bids(bidder_id);

-- Comment section loads
CREATE INDEX IF NOT EXISTS idx_comments_vehicle_id ON public.comments(vehicle_id);

-- Profile rating & review display
CREATE INDEX IF NOT EXISTS idx_feedback_reviewee_id ON public.feedback(reviewee_id);

-- Report status filter in admin dashboard
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_vehicle_id ON public.reports(vehicle_id);
```

---

## Summary Table

| # | Severity | Area | Issue | Fixed |
|---|----------|------|-------|-------|
| 1 | 🔴 Critical | `place_bid` function | Lost auction-active, auction-ended, and self-bid checks | ✅ `20260505082340` |
| 2 | 🔴 Critical | `profiles.member_since` | Stored as TEXT instead of TIMESTAMPTZ | ✅ `20260505082341` |
| 3 | 🔴 Critical | `profiles.date_of_birth` | Stored as TEXT instead of DATE | ✅ `20260505082341` |
| 4 | 🔴 Critical | `vehicles` | `status` and `approval_status` missing CHECK constraints | ✅ `20260505082342` |
| 5 | 🟠 Important | Multiple tables | FK constraints to `auth.users` stripped by 2025-11-14 reset | ✅ `20260505082343` |
| 6 | 🟡 Design | `profiles.rating` | No default — new users start with NULL rating | ❌ |
| 7 | 🟡 Design | `feedback` | UNIQUE constraint broken when `vehicle_id` is NULL | ❌ |
| 8 | 🟡 Design | `profiles.vehicles_sold` | No trigger to auto-increment on auction end | ❌ |
| 9 | 🟡 Design | `notifications.vehicle_id` | NOT NULL prevents non-auction notifications | ❌ |
| 10 | 🟢 Performance | Multiple tables | 9 missing indexes on high-traffic query columns | ❌ |
