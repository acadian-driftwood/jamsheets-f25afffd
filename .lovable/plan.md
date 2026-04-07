

# Fix Timezone Display in Show Schedule

## Problem

1. Shows created before the timezone feature have `null` timezone, so the banner says "All times in local time" instead of a real timezone.
2. Each schedule item redundantly shows the timezone abbreviation (e.g. "10:00 PM ET") even though the banner already states it — and the `w-[56px]` column is too narrow to fit that, causing layout issues.

## Fix

### `src/pages/ShowDetailPage.tsx`

**Banner**: Keep as-is — it already shows the correct timezone when one is set. For shows without a timezone, fall back to the creator's browser timezone label (or keep "local time").

**Schedule item times**: Remove the inline timezone abbreviation from each row. The banner covers it. Widen the time column from `w-[56px]` to `w-[72px]` so "10:00 PM" fits comfortably.

**Show header subtitle**: Already shows timezone abbreviation from previous work — no change needed.

### Existing shows without timezone

For shows created before the timezone column existed, the `null` value means "local time." This is correct — the user can edit the show to set a timezone. No backfill needed.

## Files

| File | Change |
|------|--------|
| `src/pages/ShowDetailPage.tsx` | Remove per-item timezone abbreviation, widen time column |

