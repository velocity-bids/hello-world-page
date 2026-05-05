# Refactoring Plan — BidWheels Frontend

## Section 1: Architecture Overview

**Framework:** Vite + React 18 (SPA) with react-router-dom v6 (not Next.js App Router despite shadcn/ui presence)  
**UI:** shadcn/ui + Tailwind CSS + Radix primitives  
**State:** Mix of raw `useState`/`useEffect`, 2 React Contexts, and @tanstack/react-query (underutilised)  
**Data:** Supabase client with a custom query/mutation layer (`src/db/`)  
**Routing:** Flat `<Routes>` in `App.tsx`, no layout nesting or route protection  

### Current file organisation:
```
src/
├── components/        (29 top-level + ui/ + auth/ + vehicle/ + profile/ + common/)
├── contexts/          (2 contexts: AuthModal, IdVerification)
├── db/queries/        (12 files — read layer)
├── db/mutations/      (10 files — write layer)
├── hooks/             (10 hooks)
├── pages/             (16 pages)
├── integrations/      (Supabase client)
├── types/             (shared types)
└── lib/               (utils)
```

---

## Section 2: Key Problems

### P1 — God Components
| File | LOC | Issue |
|------|-----|-------|
| `CreateListing.tsx` | 1050 | Zod schema + multi-step wizard + file uploads + mutation + entire JSX |
| `AdminDashboard.tsx` | 906 | 3 tabs (vehicles, users, reports), inline data tables, dialogs, mutations |
| `VehicleDetail.tsx` | 471 | 11 `useState`, direct Supabase calls, bidding logic, admin approval, watchlist |

### P2 — Inconsistent Data Fetching
- `AdminDashboard` and `ReviewListing` use `@tanstack/react-query` (useQuery/useMutation)
- All other pages use raw `useState` + `useEffect` + manual loading/error states
- Result: no cache sharing, no background refetch, duplicate loading patterns

### P3 — `useAuth` is not a Context
- Every component calling `useAuth()` creates its **own** `onAuthStateChange` subscription
- Navbar, VehicleDetail, BiddingCard, multiple pages all mount independent subscriptions
- Should be a single `AuthProvider` context at the root

### P4 — Stale Closure Bug (Realtime Subscriptions)
- `useWatchedVehicles` (line 50–62) and `useNotifications` (line 50–62) both:
  1. Declare `let userId`
  2. Set it asynchronously via `.then()`
  3. Use it **synchronously** in the channel filter before the `.then()` resolves
- Result: the filter is always `undefined` on first mount → unfiltered subscription

### P5 — Dead Code
- `HeroCard.tsx` — zero imports anywhere, completely dead
- `Hero.tsx` — imported in `BasePage.tsx` but never rendered
- `HashRouter` import in `App.tsx` — unused
- `/profile` and `/settings` — duplicate routes to same component

### P6 — No Route Protection
- Auth/admin checks are ad-hoc inside each page (`if (!user) return redirect`)
- No `<ProtectedRoute>` wrapper — easy to forget on new pages

### P7 — Data Layer Boilerplate
- Every function in `src/db/queries/` and `src/db/mutations/` wraps identical try/catch:
  ```ts
  try { ... } catch (error) { return { data: null, error: error as Error } }
  ```
- ~25 instances of the same 4-line pattern

### P8 — Hardcoded strings / no i18n prep
- The `multi-select.tsx` has `"marcas"` hardcoded (line 49 of the selection)
- Mileage options use Portuguese labels in some files, English in others
- No consistent locale approach for number formatting

---

## Section 3: Reusability Opportunities

### 3.1 Components to extract

| Opportunity | Current Location | Proposed Component |
|-------------|------------------|--------------------|
| Filter card (styled wrapper) | Duplicated in `PremiumHero.tsx` and `Auctions.tsx` | `<FilterCard>` — shared layout shell |
| Vehicle stat row (year, km, bid) | Repeated in VehicleCard, Watching, MyListings, ListingGrid | `<VehicleStats>` — composable stat display |
| Admin action buttons (approve/reject) | Inline in VehicleDetail + ReviewListing | `<AdminActions vehicle={} onAction={}>` |
| Confirmation dialog | Custom dialogs in Auctions, MyListings, AdminDashboard | `<ConfirmDialog>` with slots |
| Multi-step form wizard | Inlined in CreateListing (1050 LOC) | `<FormWizard steps={} />` with step components |

### 3.2 Hooks to extract

| Opportunity | Current Location | Proposed Hook |
|-------------|------------------|--------------------|
| Bid submission logic | VehicleDetail (lines 120–170) | `useBidSubmission(vehicleId)` |
| Admin approval logic | VehicleDetail + ReviewListing | `useAdminApproval(vehicleId)` |
| Infinite scroll | Auctions.tsx (observer setup) | `useInfiniteScroll(callback)` |
| Debounced value | Removed (was mileage slider) but useful pattern | `useDebouncedValue(value, delay)` |

### 3.3 Repeated business logic

- **Currency formatting** — `{value.toLocaleString()} €` repeated 15+ times → `formatCurrency(value)` util
- **Time left calculation** — `calculateTimeLeft()` defined in Auctions.tsx, similar logic in useCountdown → consolidate
- **Vehicle title** — `` `${vehicle.year} ${vehicle.make} ${vehicle.model}` `` repeated 8+ times → `getVehicleTitle(v)` util

---

## Section 4: State Management Issues

### 4.1 Prop drilling
- `user` from `useAuth()` is consumed in 10+ components independently (each creating a subscription)
- `isAdmin` derived from user, consumed via separate `useIsAdmin()` hook which also calls `useAuth()` internally

### 4.2 Redundant local state
- `VehicleDetail.tsx` has 11 `useState` calls; `watching`, `watchLoading` duplicate state already in `useWatchedVehicles`
- `Auctions.tsx` previously had both `sliderValue` and `maxMileage` (debounced copy) — now fixed

### 4.3 Server state not treated as server state
- Vehicle data, bids, profiles are fetched via `useEffect` + `useState` instead of React Query
- No cache invalidation strategy — navigating away and back re-fetches everything
- `AdminDashboard` uses React Query correctly (cache, mutations, optimistic updates) but is the only page doing so

### 4.4 Where state should live
| Data | Current | Should Be |
|------|---------|-----------|
| Auth user/session | Per-hook subscriptions | `AuthContext` (single subscription) |
| Vehicle list/detail | Local useState | React Query cache (queryKey-based) |
| Bids | Local useState | React Query + realtime invalidation |
| Notifications | Custom hook with realtime | React Query + realtime subscription trigger |
| Filter state (Auctions) | Local state + URL params | URL params as single source (derive from `useSearchParams`) |

---

## Section 5: Phased Refactoring Plan

### Phase 1: Safe Structural Improvements
**Goals:** Remove dead code, fix bugs, establish patterns without changing behaviour

- Delete dead files: `HeroCard.tsx`, `Hero.tsx` (after removing import from BasePage)
- Remove unused `HashRouter` import from App.tsx
- Remove duplicate `/settings` route (keep `/profile`)
- Fix stale closure bug in `useWatchedVehicles` and `useNotifications` (await user before subscribing)
- Convert `useAuth` to `AuthProvider` context + `useAuth` consumer hook
- Remove leftover `console.log` from Navbar (`console.log("🚀 ~ Navbar ~ user:", user)`)
- Extract `formatCurrency()` and `getVehicleTitle()` utils; replace all inline instances

**Risks:**
- AuthProvider refactor touches every file consuming `useAuth` (low risk if interface unchanged)
- Realtime fix could reveal previously-hidden bugs where unfiltered events were handled

---

### Phase 2: Component Extraction
**Goals:** Break god components into focused, reusable pieces

- `CreateListing.tsx` → extract: `CreateListingSchema.ts` (Zod), `steps/BasicInfoStep.tsx`, `steps/DetailsStep.tsx`, `steps/PhotosStep.tsx`, `steps/ReviewStep.tsx`, `FormWizard.tsx`
- `AdminDashboard.tsx` → extract: `admin/VehiclesTab.tsx`, `admin/UsersTab.tsx`, `admin/ReportsTab.tsx`
- `VehicleDetail.tsx` → extract: `useBidSubmission` hook, `useAdminApproval` hook, reduce to pure composition
- Extract `<ConfirmDialog>` from repeated inline Dialog patterns
- Extract `<InfiniteScrollTrigger>` from Auctions page observer logic
- Create `<ProtectedRoute>` and `<AdminRoute>` wrappers in App.tsx

**Risks:**
- Splitting CreateListing requires careful form state sharing (react-hook-form `FormProvider` handles this)
- AdminDashboard tabs share some state (selected vehicle for dialog) — need shared context or lift state

---

### Phase 3: Logic Consolidation (Hooks & Services)
**Goals:** Migrate to consistent React Query usage, consolidate data access

- Create `src/db/helpers.ts` with `withQuery<T>(fn)` wrapper to eliminate try/catch boilerplate
- Migrate all pages to React Query for server state (start with VehicleDetail, Auctions, MyListings)
- Create query key factory: `vehicleKeys.list(filters)`, `vehicleKeys.detail(id)`, `bidKeys.forVehicle(id)`
- Integrate Supabase realtime with React Query (on realtime event → `queryClient.invalidateQueries`)
- Consolidate vehicle filter logic: hero + auctions page share same `buildFilterParams()` function
- Make `useFilteredVehicles` a thin wrapper around `useInfiniteQuery`

**Risks:**
- React Query migration is the largest change — do one page at a time, run in parallel with old pattern
- Realtime + cache invalidation needs careful testing (race conditions, stale data)

---

### Phase 4: Optional Optimizations
**Goals:** Performance, DX, and polish

- Code-split pages with `React.lazy()` + `<Suspense>` (bundle is 1.3MB)
- Add route-level loading skeletons
- Replace `react-router-dom` flat routes with nested layout routes (share Navbar/Footer)
- Add proper i18n foundation (even if only PT for now) — extract all user-facing strings
- Add barrel exports cleanup (some `index.ts` files exist, others don't)
- Consider moving the `multi-select.tsx` label (`"marcas"`) to accept a `pluralLabel` prop

**Risks:**
- Code splitting adds complexity to error boundaries
- Layout routes change the component tree — test navigation transitions

---

## Section 6: Risk Assessment

### High-risk areas (fragile / tightly coupled)

| Area | Why Fragile | Regression Risk |
|------|-------------|-----------------|
| `useAuth` → AuthProvider | Every authenticated page depends on it | Medium — keep same hook API |
| `CreateListing` split | 1050-line single-file form with interdependent steps | High — form state coupling |
| Realtime subscriptions | Currently buggy (stale closure); fixing may expose issues | Medium |
| React Query migration | Touching data flow in every page | High if done all at once; low if incremental |

### Dependency graph concerns
- `useIsAdmin` → calls `useAuth` internally → if auth becomes context, this just works
- `useWatchedVehicles` → calls `supabase.auth.getUser()` directly (bypasses auth hook) → should use context
- `BiddingCard` → receives props from `VehicleDetail` (good) but also calls `useAuth` and `useAuthModal` (mixed)

### Safe refactors (low regression risk)
- Dead code removal
- Utility extraction (formatCurrency, getVehicleTitle)
- Console.log cleanup
- Duplicate route removal
- ConfirmDialog extraction (purely additive)
