

# Fix Quick-Add Flow, Add Travel Detail Page with Delete, Lock Dates

## Three changes

### 1. Skip redundant travel type picker from QuickAddSheet

When the user taps "Flight", "Rental Car", or "Drive" from the tour timeline, the type is already known. Pass `defaultSubtype` to `CreateTravelModal` so it skips the type-selection step and goes straight to the form.

**Files:**
- **`CreateTravelModal.tsx`** — accept optional `defaultSubtype` prop. When set, initialize `step="form"` and `travelType` to match. Hide the "Back" button (no type step to return to). On close, reset properly.
- **`TourDetailPage.tsx`** — pass `travelSubtype` as `defaultSubtype` prop to `CreateTravelModal`.

### 2. Travel detail page with delete at the bottom (like shows)

Create a new `TravelDetailPage` at `/travel/:id` that displays the travel item's details and includes a Danger Zone section at the bottom for privileged users to delete it — matching the pattern on `ShowDetailPage`.

**New file: `src/pages/TravelDetailPage.tsx`**
- Fetch the `tour_timeline_items` record by ID
- Display all relevant fields (title, type, locations, dates/times, airline, confirmation, rental company, traveler, notes)
- Danger Zone at the bottom with "Delete Travel Item" button (confirm dialog, then delete from `tour_timeline_items`, also delete any linked items, navigate back)
- Edit button in header for privileged users (stretch — can skip for now and just do view + delete)

**`App.tsx`** — add route `/travel/:id` pointing to `TravelDetailPage`

**`TourDetailPage.tsx`** — make travel/day-off cards tappable, navigating to `/travel/{item.id}`. Update both the `SortableItem` component and the non-sortable rendering to add `onClick={() => navigate(\`/travel/${item.id}\`)}` and a `ChevronRight` icon for non-show timeline items.

### 3. Lock the date field when `defaultDate` is provided

When adding from the tour timeline, the date is already determined.

- **`CreateShowModal.tsx`** — disable date input when `defaultDate` is set
- **`CreateTravelModal.tsx`** — disable departure date input when `defaultDate` is set
- **`CreateDayOffModal.tsx`** — disable date input when `defaultDate` is set

## Files summary

| File | Change |
|------|--------|
| `src/pages/TravelDetailPage.tsx` | New — detail view with Danger Zone delete |
| `src/App.tsx` | Add `/travel/:id` route |
| `src/pages/TourDetailPage.tsx` | Make travel cards tappable, pass `defaultSubtype` to CreateTravelModal |
| `src/components/modals/CreateTravelModal.tsx` | Accept `defaultSubtype`, skip type step, lock date |
| `src/components/modals/CreateShowModal.tsx` | Lock date when `defaultDate` set |
| `src/components/modals/CreateDayOffModal.tsx` | Lock date when `defaultDate` set |

