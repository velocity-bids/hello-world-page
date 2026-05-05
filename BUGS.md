# Bug Tracker

All bugs found during the automated code review. Fixed column updated as issues are resolved.

---

## 🔴 Critical / Security

| # | File | Bug | Fixed |
|---|---|---|---|
| 1 | `LoginModal.tsx:63` | **Hardcoded DOB on signup** — passes `"1995-08-21"` instead of the `dateOfBirth` state; every new user gets the wrong date of birth | ✅ |
| 2 | `ProfileSettings.tsx:79` | **ID documents publicly accessible** — uploaded to a public bucket via `getPublicUrl`; private identity docs are world-readable | ✅ |
| 6 | `mutations/notifications.ts:7` | **markNotificationAsRead has no user_id filter** — anyone who guesses a notification ID can mark it read | ✅ |
| 7 | `mutations/comments.ts:26` | **deleteComment has no ownership check** — deletes by ID only, no `user_id` guard in app code | ✅ |

---

## 🟠 Functional / Data Bugs

| # | File | Bug | Fixed |
|---|---|---|---|
| 3 | `queries/vehicles.ts:6` | **getVehicleById exposes pending/declined listings** — no `approval_status` filter; hidden listings visible by URL | ✅ |
| 4 | `mutations/vehicles.ts:79` | **updateVehicle has no seller_id check** — any caller can update another user's listing | ✅ |
| 5 | `mutations/vehicles.ts:121` | **deleteVehicle never checks if bids exist** — listings with active bids can be deleted | ✅ |
| 21 | `queries/bids.ts:6` | **Bids ordered by `amount` not `created_at`** — "recent bids" view is not chronological | ✅ |
| 22 | `VehicleDetail.tsx:150` | **`winningBidderId` not updated on live bids** — after real-time bidding, feedback eligibility points at the wrong winner | ✅ |
| 24 | `ProfileSettings.tsx:38` | **`.single()` crashes for new users** — no profile row yet → error state; should use `.maybeSingle()` | ✅ |
| 28 | `CreateListing.tsx:979` | **Mixed currency `€` vs `$`** — review step shows `€`, rest of app uses `$` | ✅ |

---

## 🟡 Race Conditions / State Bugs

| # | File | Bug | Fixed |
|---|---|---|---|
| 8 | `mutations/user-roles.ts:12` | **Non-atomic select+insert for role assignment** — concurrent changes can duplicate; use `upsert` | ✅ |
| 9 | `useAuth.tsx:11` | **Double session fetch + state-after-unmount** — `onAuthStateChange` already emits `INITIAL_SESSION`; redundant `getSession()` can update dead state | ✅ |
| 10 | `useIsAdmin.tsx:14` | **`isAdmin` stale on user switch** — `loading` not reset before async check; previous user's admin status briefly leaks | ✅ |
| 11 | `useFilteredVehicles.tsx:18` | **No request cancellation** — slow stale response can overwrite newer filter results | ✅ |
| 12 | `useFilteredVehicles.tsx:30` | **Filter changes append instead of replace** — page > 0 when filters change causes vehicles from different filters to mix | ✅ |
| 15 | `IdVerificationContext.tsx:67` | **Timer leak on unmount** — `setTimeout` never stored or cleared; updates dead state after unmount | ✅ |
| 19 | `CommentSection.tsx:24` | **Stale comment fetch after navigation** — old `vehicleId` fetch can overwrite current vehicle's comments | ✅ |
| 20 | `BidHistoryModal.tsx:28` | **Stale bid history on open/close** — race between open/close leaves stale data | ✅ |
| 23 | `Auth.tsx:54`, `LoginModal.tsx:77` | **OAuth loading cleared before redirect** — `isLoading = false` immediately after triggering OAuth; double-click starts two flows | ✅ |

---

## 🟡 Render Bugs

| # | File | Bug | Fixed |
|---|---|---|---|
| 16 | `FeaturedAuctions.tsx:8` | **Countdown never re-ticks** — time computed once at render; auction countdowns go stale without a page refresh | ✅ |
| 17 | `VehicleCard.tsx:32` | **Broken image URL when no image** — empty string produces `"-/resize/322x/"` (Uploadcare transform with no source); needs placeholder guard | ✅ |
| 18 | `VehicleCard.tsx:69` + `VehicleInfo.tsx:46` | **Mileage unit inconsistency** — card shows `mi`, detail page shows `km` for the same value | ✅ |
| 25 | `profile/ProfileHeader.tsx:42` | **Crash on empty `memberSince`** — `format(new Date(""))` throws `Invalid time value`; can crash the profile page | ✅ |
| 30 | `ReviewListing.tsx:146` | **`navigate()` called during render** — non-admin redirect happens in render body; React warning + possible double navigation; use `<Navigate/>` or `useEffect` | ✅ |

---

## 🟢 UX / Minor Bugs

| # | File | Bug | Fixed |
|---|---|---|---|
| 13 | `useWatchedVehicles.tsx:83` | **Duplicate watch check uses wrong error field** — checks `error.message` for `"23505"` but Postgres puts it in `error.code`; shows generic failure | ✅ |
| 14 | `useWatchedVehicles.tsx` + `useNotifications.tsx` | **Realtime subscriptions not scoped to current user** — listens to all users' changes; unnecessary refetches for everyone | ✅ |
| 26 | `ReportModal.tsx:81` | **Stale form state on reopen** — closing doesn't reset `reason`/`description`; reopening shows old report text | ✅ |
| 27 | `BiddingCard.tsx:91` | **Watch button hidden on ended auctions** — only rendered when `isActive && !isEnded`; users can't manage watchlist for ended auctions | ✅ |
| 29 | `AdminDashboard.tsx:63` | **Pagination not reset on search/filter change** — switching to a smaller result set can show an empty table on an invalid page number | ✅ |
