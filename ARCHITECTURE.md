# BidWheels — Architecture & Page Reference

> Portugal-focused car auction platform inspired by Cars & Bids. Sellers list vehicles, admins approve them, buyers bid in real-time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS + shadcn/ui (Radix UI primitives) |
| State / Data | TanStack Query (React Query v5) |
| Forms | React Hook Form + Zod |
| Backend / DB | Supabase (Postgres + Auth + Realtime + Storage) |
| Image Upload | Uploadcare |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Notifications | Sonner (toasts) |
| Deployment | GitHub Pages (`gh-pages`) |

---

## Project Structure

```
src/
├── pages/          # One file per route
├── components/     # Reusable UI components
│   ├── auth/       # OAuth buttons
│   ├── common/     # Shared utility components (EmptyState, PageLoader, etc.)
│   ├── profile/    # Profile page sub-components
│   ├── vehicle/    # Vehicle detail sub-components (BiddingCard, SellerCard, etc.)
│   └── ui/         # shadcn/ui primitives
├── contexts/       # React contexts (auth modal, ID verification)
├── db/
│   ├── queries/    # Read-only Supabase queries (one file per domain)
│   └── mutations/  # Write Supabase mutations (one file per domain)
├── hooks/          # Custom React hooks
├── integrations/
│   └── supabase/   # Supabase client + generated types
├── lib/            # Utility functions (cn, age-utils, etc.)
└── types/          # Shared TypeScript types (index.ts)

supabase/
├── migrations/     # Postgres migration files (chronological)
├── functions/
│   └── check-auction-endings/  # Edge Function (Deno)
└── config.toml
```

---

## Pages

### `/` — Home (`Index.tsx`)
Landing page. Composed of:
- `PremiumHero` — hero banner with CTA
- `FeaturedAuctions` — curated active auctions
- `HowItWorks` — explainer section for new users

---

### `/auctions` — Auctions (`Auctions.tsx`)
Browse all active & approved listings. Features:
- Filter by **brand** (dropdown) and **max mileage** (slider)
- Infinite scroll pagination (IntersectionObserver)
- Admin users see a delete button on each card
- Uses `useFilteredVehicles` hook + `useVehicleBrands` hook

---

### `/vehicle/:id` — Vehicle Detail (`VehicleDetail.tsx`)
Core auction page. Layout: 2/3 main + 1/3 sticky sidebar.

**Main column:**
- `VehicleGallery` — image carousel
- `ShareButtons` + `ReportModal`
- `VehicleInfo` — specs table (engine, colour, fuel, transmission, etc.)
- Description card
- `CommentSection` — threaded comments
- `FeedbackForm` — shown after auction ends to seller/winner

**Sidebar:**
- `BiddingCard` — current bid, countdown, place bid, quick-bid buttons, watchlist toggle
- `SellerCard` — seller profile snippet
- Admin panel (approve/decline with notes) — admin only, not own listing
- `RecentBidsCard` + `BidHistoryModal`

**Real-time:** Supabase Realtime channels for vehicle updates and new bids.

---

### `/sell` — Create Listing (`CreateListing.tsx`)
Multi-step form for sellers. Requires:
1. Authentication (prompts login modal if not logged in)
2. **ID Verification** (via `IdVerificationContext` + `IdVerificationModal`) — must be ≥18 and have verified identity

Form fields (validated with Zod):
- Basic: make, model, year, mileage, VIN, description
- Specs: horsepower, engine type/displacement, fuel type, transmission, doors
- Condition: exterior/interior colour, imported flag, maintenance book, smoker, number of owners
- Auction: reserve price, starting bid, end date/time
- Images: uploaded via Uploadcare (`UploadCareWidget`)

On submit: calls `createVehicle` mutation → sets `approval_status: 'pending'`.

---

### `/edit-listing/:id` — Edit Listing (`EditListing.tsx`)
Same form as Create Listing, pre-populated with existing data. Only accessible by the original seller. Calls `updateVehicle` mutation.

---

### `/review/:id` — Review Listing (`ReviewListing.tsx`)
Admin-only focused review page for a single pending listing. Shows full vehicle details + gallery + approve/decline actions with notes. Redirects non-admins away.

---

### `/auth` — Auth (`Auth.tsx`)
Full-page authentication. Two tabs:
- **Login** — email/password via `useAuth().signIn`
- **Sign Up** — email, password, display name, date of birth (must be ≥18), address

Also includes `OAuthButtons` (Google, Apple OAuth via Supabase).
Redirects authenticated users to `/`.

---

### `/auth/callback` — Auth Callback (`AuthCallback.tsx`)
Handles OAuth redirect after Google/Apple sign-in. Processes the Supabase session token from the URL and redirects to home.

---

### `/my-bids` — My Bids (`MyBids.tsx`)
Shows all bids placed by the logged-in user. Requires auth.
- Filter by status: **All / Leading / Outbid / Won / Lost**
- Sort by: **Recent / Ending Soon / Highest Bid / Lowest Bid**
- Each entry is a `BidCard` linking to the auction

---

### `/my-listings` — My Listings (`MyListings.tsx`)
Shows all vehicles listed by the logged-in user. Requires auth.
- Shows approval status badge (pending / approved / declined)
- Links to edit and detail page
- Can delete pending/ended listings
- Real-time subscription updates listing status live

---

### `/watching` — Watching (`Watching.tsx`)
Watchlist of vehicles the user is monitoring. Requires auth.
- Remove from watchlist
- Toggle `notify_on_sale` / `notify_on_outbid` notification preferences per vehicle
- Countdown timer for each watched auction

---

### `/profile` or `/settings` — Profile Settings (`ProfileSettings.tsx`)
Edit own profile. Requires auth. Fields:
- Display name, bio, address, date of birth
- Avatar upload (Supabase Storage via `AvatarUpload`)
- ID document upload for verification

---

### `/user/:userId` — User Profile (`UserProfile.tsx`)
Public profile of any user. Tabs:
- **Active Listings** — `ListingGrid` of current auctions
- **Past Listings** — completed auctions
- **Feedback** — `FeedbackList` from buyers/sellers
- **Stats** — `StatsCard` (vehicles sold, rating, member since)
- `ReputationCard` — overall reputation summary

---

### `/admin` — Admin Dashboard (`AdminDashboard.tsx`)
Admin-only (redirects if not admin). Tabbed interface:

| Tab | Content |
|---|---|
| **Listings** | All vehicles with approval status; approve/decline with notes; delete; paginated table |
| **Users** | All registered users; search; change role (user/admin) |
| **Reports** | User-submitted reports; mark as reviewed/dismissed |

Uses TanStack Query for data fetching with mutations + cache invalidation.

---

### `/about` — About (`About.tsx`)
Static marketing page. Sections: hero, mission, values (trust, transparency, community), team. App name used here is **BidWheels**.

---

### `*` — Not Found (`NotFound.tsx`)
404 fallback page with link back to home.

---

## Database Schema (Supabase / Postgres)

All tables have **Row Level Security (RLS)** enabled.

### `profiles`
Extends `auth.users`. Created automatically via trigger on signup.

| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID | FK → auth.users |
| `display_name` | text | |
| `avatar_url` | text | |
| `bio` | text | |
| `rating` | decimal(3,2) | Default 5.0 |
| `vehicles_sold` | int | |
| `member_since` | timestamptz | |
| `verified` | bool | ID verification status |
| `date_of_birth` | date | Age gate for selling |
| `address` | text | |

### `vehicles`
Core auction listing.

| Column | Type | Notes |
|---|---|---|
| `seller_id` | UUID | FK → profiles |
| `make`, `model`, `year` | text/int | |
| `mileage` | int | |
| `vin` | text | |
| `description` | text | |
| `images` | text[] | Array of Uploadcare URLs |
| `image_url` | text | Primary image (legacy/fallback) |
| `current_bid` | numeric | Updated by `place_bid` RPC |
| `bid_count` | int | |
| `reserve_price` | numeric | |
| `starting_bid` | numeric | |
| `auction_end_time` | timestamptz | |
| `status` | text | `active` / `sold` / `ended` |
| `approval_status` | text | `pending` / `approved` / `declined` |
| `admin_notes` | text | |
| Engine/condition fields | various | horsepower, fuel_type, transmission, etc. |

### `bids`

| Column | Type |
|---|---|
| `vehicle_id` | UUID |
| `bidder_id` | UUID |
| `amount` | numeric |

Bidding uses a **Postgres RPC function** `place_bid` which validates and atomically updates `current_bid` and `bid_count`.

### `watched_vehicles`

| Column | Type |
|---|---|
| `user_id` | UUID |
| `vehicle_id` | UUID |
| `notify_on_sale` | bool |
| `notify_on_outbid` | bool |

### `notifications`

| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID | |
| `vehicle_id` | UUID | |
| `type` | text | `auction_ending` / `auction_ended` / `outbid` |
| `message` | text | |
| `is_read` | bool | |
| `metadata` | jsonb | |

### `comments`
Per-vehicle comments. Users can post, edit, delete their own.

### `feedback`
Post-auction ratings between seller and winning buyer. `rating` (1–5) + optional `comment`.

### `reports`
User-submitted reports on listings. Admins review via the Reports tab in the dashboard.

### `user_roles`
Stores `role: 'admin'` for admin users. Checked client-side via `useIsAdmin` hook (actual enforcement is via RLS policies server-side).

---

## Key Hooks

| Hook | Purpose |
|---|---|
| `useAuth` | Session state, signIn/signUp/signOut/OAuth |
| `useIsAdmin` | Checks `user_roles` table for admin role |
| `useCountdown` | Live countdown from `auction_end_time` |
| `useFilteredVehicles` | Paginated + filtered vehicle list |
| `useVehicleBrands` | Distinct makes from active vehicles |
| `useWatchedVehicles` | Watchlist CRUD + notification prefs |
| `useNotifications` | Bell icon unread count + mark as read |
| `useVehicles` | All active vehicles (for featured/home) |

---

## Contexts

| Context | Purpose |
|---|---|
| `AuthModalContext` | Controls the global `LoginModal` overlay; any component can call `openLoginModal()` |
| `IdVerificationContext` | Tracks ID verification status + expiry (required before creating a listing) |

---

## Data Layer (`src/db/`)

All database access is split into **queries** (reads) and **mutations** (writes), each separated by domain:

**Queries:** `vehicles`, `bids`, `comments`, `feedback`, `notifications`, `profiles`, `reports`, `user-roles`, `users`, `watched-vehicles`

**Mutations:** `vehicles`, `comments`, `feedback`, `notifications`, `profiles`, `reports`, `user-roles`, `watched-vehicles`

---

## Edge Function

### `check-auction-endings` (Deno)
Called on a schedule (or manually). Does two things:
1. **Ending-soon notifications** — finds auctions ending within 24 hours, sends `auction_ending` notifications to watchers with `notify_on_sale: true`
2. **Auction close** — finds active auctions past their `auction_end_time`, updates status to `sold` (if bids exist) or `ended`, and sends `auction_ended` notifications

---

## Auth Flow

1. **Email/Password** — standard Supabase auth with email confirmation
2. **Google OAuth** — redirects to `/auth/callback`, handled by `AuthCallback.tsx`
3. **Apple OAuth** — same flow
4. On any new signup, a Postgres trigger (`on_auth_user_created`) auto-creates a `profiles` row
5. Age validation (≥18) is enforced client-side before allowing listing creation

---

## Listing Lifecycle

```
Seller submits → approval_status: 'pending', status: 'active'
        ↓
Admin reviews (ReviewListing or AdminDashboard or VehicleDetail admin panel)
        ↓
   approved → visible to bidders
   declined → hidden, seller sees notes
        ↓
Auction end_time passes → Edge Function runs
        ↓
   bids exist → status: 'sold'
   no bids   → status: 'ended'
        ↓
Seller + winner can leave feedback via FeedbackForm
```

---

## Real-Time

Supabase Realtime channels are used on the `VehicleDetail` page:
- `vehicle-{id}` channel — listens for `UPDATE` on the `vehicles` table to reflect bid changes live
- `bids-{id}` channel — listens for `INSERT` on `bids` to show new bids in the sidebar instantly with a toast notification
