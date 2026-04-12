

# Support Multiple Hotels Per Show

## Problem
The current implementation assumes one hotel per show — the hook returns a single hotel, the UI shows one card, and we just added a unique constraint on `show_hotels(show_id)` that actively prevents multiple entries.

## Plan

### 1. Database migration — Drop the unique constraint
Remove the `show_hotels_show_id_unique` constraint we just added.

### 2. `src/hooks/useData.ts` — Return an array of hotels
- Rename `useShowHotel` → `useShowHotels` (return all hotels for a show, ordered by `created_at`)
- Change query key from `"show-hotel"` to `"show-hotels"`
- `useUpsertHotel` and `useDeleteHotel` — update invalidation query key to `"show-hotels"`

### 3. `src/pages/ShowDetailPage.tsx` — Render a list of hotel cards
- **HotelSection**: Use `useShowHotels` to get an array. Map over hotels to render each as an individual card (with its own edit/delete). Each card tracks its own `editingId` state.
- The "+ Add hotel" button is always visible at the bottom (not just when zero hotels exist).
- Adding a new hotel never passes an `id`, so it always inserts.
- **ReadinessBar**: Update to use `useShowHotels` and check `hotels?.length > 0` for the readiness dot.

## Files

| File | Change |
|------|--------|
| Migration | `ALTER TABLE show_hotels DROP CONSTRAINT show_hotels_show_id_unique` |
| `src/hooks/useData.ts` | Rename hook, return array, update query keys |
| `src/pages/ShowDetailPage.tsx` | Render list of hotel cards, always show "+ Add hotel" |

