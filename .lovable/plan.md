

# JamSheets Revision Plan

## Overview
Four workstreams: (1) streamline invite/onboarding flow, (2) add travel item creation in tours, (3) role-based settings visibility, (4) password change in Profile.

---

## 1. Invite / Onboarding Flow

**Problem:** Invited users must click the email link, create an account, then re-click the email link to reach the join page. The flow should be a single sequence.

**Solution:**

- **LoginPage.tsx**: When arriving via `/login?redirect=/join?token=...`, auto-set mode to `signup`. After successful signup (auto-confirm is already enabled), immediately navigate to the redirect URL (`/join?token=...`) instead of showing "check your email." The `onAuthStateChange` listener in AuthContext will pick up the new session and `RequireAuth` will let them through.

- **JoinPage.tsx**: Refactor so unauthenticated users see an inline signup/login form directly on the join page (instead of redirecting to `/login`). This eliminates the redirect hop entirely. The form creates the account, and on success the page immediately calls `accept-invite`. One page, one flow.

- **Pending invite delete** is already implemented in `TeamMembersPage.tsx` with trash icon and `handleDeleteInvite`. The `confirm()` dialog is already there. This is working -- will verify it renders correctly and the edge function action works. No changes needed here based on code review.

**Files:** `src/pages/JoinPage.tsx`, `src/pages/LoginPage.tsx`

---

## 2. Travel Item Creation Inside Tours

**Database changes:**

- Add new enum values to `timeline_item_type`: `driving`, `rental_return` (currently has `off_day`, `flight`, `rental_pickup`, `rental_dropoff`)
- Add columns to `tour_timeline_items`:
  - `travel_subtype` (text, nullable) -- e.g. `one_way`, `round_trip`
  - `linked_item_id` (uuid, nullable, FK to self) -- links outbound/return legs
  - `departure_location` (text, nullable)
  - `arrival_location` (text, nullable)
  - `airline` (text, nullable)
  - `confirmation_number` (text, nullable)
  - `rental_company` (text, nullable)
  - `traveler_name` (text, nullable)

**New UI component:** `CreateTravelModal.tsx`
- Modal triggered from "Add Travel" button on TourDetailPage
- Step 1: Select travel type (Driving / Flight / Rental Car)
- Step 2: Type-specific form:
  - **Driving**: title, departure/arrival locations, departure date/time, arrival date/time, notes
  - **Flight**: one-way/round-trip toggle, traveler, airline, confirmation number, departure/arrival airports, departure/arrival date+time, notes. If round-trip: show return flight fields too.
  - **Rental Car**: one-way/round-trip toggle, traveler/driver, rental company, confirmation number, pickup/dropoff locations, pickup/dropoff date+time, notes. If round-trip: show return fields.
- On submit: insert 1 or 2 `tour_timeline_items` rows. For round-trip, link them via `linked_item_id`.

**TourDetailPage.tsx changes:**
- Add "Add Travel" button next to "Add Show" (only for privileged roles)
- Travel items already render in the merged timeline -- just need to handle the new `driving` type icon

**TravelPage.tsx changes:**
- Include `driving` type in the query filter
- Display new fields (departure/arrival locations, confirmation numbers)

**TodayPage.tsx changes:**
- Query `tour_timeline_items` for today's date and show travel events in a "Travel Today" section

**useData.ts:**
- Add `useCreateTimelineItem` mutation hook

**Files:** Migration SQL, `src/components/modals/CreateTravelModal.tsx`, `src/pages/TourDetailPage.tsx`, `src/pages/TravelPage.tsx`, `src/pages/TodayPage.tsx`, `src/hooks/useData.ts`

---

## 3. Role-Based Settings Visibility

**SettingsPage.tsx:**
- Filter the Workspace items array based on `currentOrg.role`:
  - **Billing**: visible only to `owner`, `admin`
  - **Roles & Permissions**: visible only to `owner`, `admin`, `tm`
- Lower roles (`member`, `crew`, `readonly`) see only Band Settings, Team Members, Profile, Sign Out

**TeamMembersPage.tsx:**
- Pending invites section: only render if `isAdmin` (owner/admin). Currently the invite form is gated by `isAdmin` but the pending invites list is visible to all -- gate it behind `isAdmin` too.

**Files:** `src/pages/SettingsPage.tsx`, `src/pages/settings/TeamMembersPage.tsx`

---

## 4. Password Change in Profile

**ProfilePage.tsx:**
- Add a "Change Password" section below the existing fields
- Two inputs: new password, confirm password
- Calls `supabase.auth.updateUser({ password: newPassword })`
- Show success/error toast
- Works for all auth flows (invite-based or self-signup)

**Files:** `src/pages/settings/ProfilePage.tsx`

---

## Technical Details

### Migration SQL
```sql
-- Add new timeline_item_type enum values
ALTER TYPE public.timeline_item_type ADD VALUE IF NOT EXISTS 'driving';
ALTER TYPE public.timeline_item_type ADD VALUE IF NOT EXISTS 'rental_return';

-- Add travel-specific columns to tour_timeline_items
ALTER TABLE public.tour_timeline_items
  ADD COLUMN IF NOT EXISTS travel_subtype text,
  ADD COLUMN IF NOT EXISTS linked_item_id uuid REFERENCES public.tour_timeline_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS departure_location text,
  ADD COLUMN IF NOT EXISTS arrival_location text,
  ADD COLUMN IF NOT EXISTS airline text,
  ADD COLUMN IF NOT EXISTS confirmation_number text,
  ADD COLUMN IF NOT EXISTS rental_company text,
  ADD COLUMN IF NOT EXISTS traveler_name text;
```

### File Change Summary
| File | Change |
|------|--------|
| Migration | Add enum values + columns to `tour_timeline_items` |
| `JoinPage.tsx` | Inline signup/login form, single-page onboarding |
| `LoginPage.tsx` | Minor: ensure redirect works after auto-confirm signup |
| `CreateTravelModal.tsx` | New: full travel creation modal with type selection |
| `TourDetailPage.tsx` | Add "Add Travel" button, handle new types |
| `TravelPage.tsx` | Include `driving` type, show new fields |
| `TodayPage.tsx` | Show today's travel items |
| `useData.ts` | Add `useCreateTimelineItem` hook |
| `SettingsPage.tsx` | Role-gate Billing and Roles & Permissions |
| `TeamMembersPage.tsx` | Role-gate pending invites visibility |
| `ProfilePage.tsx` | Add change password section |
| Edge function `team-invites` | No changes needed (already working) |

