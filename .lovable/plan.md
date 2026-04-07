

# Add Timezone Display and Edit Capability to Travel Items

## Problem

1. **Travel tab times show raw strings** (e.g. `"14:00"`) without timezone abbreviations, even though `departure_timezone` and `arrival_timezone` are stored in the database.
2. **Tour timeline travel items** show `timeStart` as a raw string with no timezone context.
3. **Travel items are not editable** — there's no edit modal. Users can only delete them from the detail page.
4. **TravelDetailPage** already formats times with timezone abbreviations (using `formatTimeInZone` + `getTimezoneAbbr`), but the list views don't.

## Fix

### 1. `src/pages/TravelPage.tsx` — Format times with timezone abbreviations

Replace the raw `{item.time_start}` display (line 141) with `formatTimeInZone(item.time_start, item.departure_timezone)` plus the timezone abbreviation. Also show arrival time + arrival timezone if present.

Import `formatTimeInZone` and `getTimezoneAbbr` from `@/lib/timezones`.

### 2. `src/pages/TourDetailPage.tsx` — Show timezone on travel timeline items

The `MergedItem` type currently only stores `timeStart` as a plain string. Add `departureTimezone` to the type, populate it from `t.departure_timezone` when building merged items, and format `item.timeStart` with its timezone in the `SortableItem` render (line 135).

### 3. `src/components/modals/EditTravelModal.tsx` — New file

Create an edit modal for travel items, mirroring the structure of `CreateTravelModal` but pre-populated with existing values. Fields:
- Title, traveler name, departure/arrival locations
- Departure/arrival dates and times
- Departure/arrival timezones (using `TIMEZONE_OPTIONS`)
- Type-specific fields: airline + confirmation (flights), rental company + confirmation (rentals)
- Notes

On save, update the `tour_timeline_items` row via `supabase.update()`. Invalidate `travel` and `tour-timeline` queries.

### 4. `src/pages/TravelDetailPage.tsx` — Add Edit button

Add an "Edit" button (for privileged users) that opens the new `EditTravelModal`, pre-filled with the current item data. Place it above the Danger Zone section.

## Files

| File | Change |
|------|--------|
| `src/pages/TravelPage.tsx` | Format `time_start` with timezone abbreviation using `formatTimeInZone` + `getTimezoneAbbr` |
| `src/pages/TourDetailPage.tsx` | Pass `departureTimezone` through `MergedItem`, format time with timezone in `SortableItem` |
| `src/components/modals/EditTravelModal.tsx` | New edit modal for travel items with all fields including timezone pickers |
| `src/pages/TravelDetailPage.tsx` | Add Edit button that opens `EditTravelModal` |

## Technical details

- The `tour_timeline_items` table already has `departure_timezone` and `arrival_timezone` columns — no database changes needed.
- The edit modal will use a flat update (no linked-item logic for round trips — editing the return leg is done separately from its own detail page).
- RLS already permits `Admin/TM can update timeline` for authenticated users with the right org role.

