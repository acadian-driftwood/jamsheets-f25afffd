## Add "Hotel" to the tour timeline Quick Add menu

Make hotels addable directly to a tour day (great for off-days and travel days), without touching the existing per-show hotel feature.

### Changes

**1. Database — add new enum value**
- Add `'hotel'` to the `timeline_item_type` enum (`ALTER TYPE ... ADD VALUE IF NOT EXISTS 'hotel'`).
- No new columns needed; we reuse existing `tour_timeline_items` fields:
  - `title` → hotel name
  - `subtitle` → address (optional)
  - `date` → check-in date
  - `time_end` → unused; we'll store check-out date in a sensible existing field. Cleanest: reuse `arrival_location` for address and add nothing new — but to keep nights clear, store check-out date in `notes` is ugly.
  - Decision: add a single nullable column `end_date date` to `tour_timeline_items` for hotel check-out (nullable, only used by hotel rows). This keeps it clean and doesn't disturb other types.

**2. New component — `src/components/modals/CreateHotelModal.tsx`**
Mirrors `CreateDayOffModal`. Fields:
- Hotel name (required)
- Check-in date (required, prefilled from selected day)
- Check-out date (optional)
- Address (optional)
- Confirmation # (optional)
- Notes (optional)

Inserts a row into `tour_timeline_items` with `type: 'hotel'`, mapping fields as:
- `title` = hotel name
- `subtitle` = address
- `date` = check-in
- `end_date` = check-out
- `confirmation_number`, `notes`

**3. `src/components/tour/QuickAddSheet.tsx`**
- Add `"hotel"` option with the `Hotel` icon from lucide-react. Place it between "Rental Car" and "Drive".
- Update `onSelect` union to include `"hotel"`.

**4. `src/pages/TourDetailPage.tsx`**
- Add `showHotel` state and render `<CreateHotelModal>`.
- Update `handleQuickAddSelect` union and route `"hotel"` → open hotel modal.
- Update `typeIcon` (return `Hotel`), `chipLabel` ("Hotel"), `chipVariant` ("muted").

**5. `src/components/modals/EditTravelModal.tsx`**
- Out of scope for this change. Hotels added to the timeline will be editable in a follow-up; for now users can delete and re-add. (Confirm if you'd like edit support included.)

### Not changed
- `CreateShowModal` hotel section and `show_hotels` table — untouched, as you requested.
- Travel modal, archiving, and timezone logic — unchanged.

### Files touched
- `supabase` migration (enum value + `end_date` column)
- `src/components/tour/QuickAddSheet.tsx`
- `src/components/modals/CreateHotelModal.tsx` (new)
- `src/pages/TourDetailPage.tsx`