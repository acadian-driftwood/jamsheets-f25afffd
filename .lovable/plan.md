

# Show Timezone Display and Schedule Time Formatting

## Problems

1. **Timezone not showing on schedule**: The banner "All times in ..." only renders when the show has a `timezone` value. Shows created before the timezone feature was added have `null` in that column, so no banner appears.

2. **Schedule times not formatted with timezone**: Line 216 tries `parseISO(item.starts_at)` on a plain time string like `"22:00"`, which fails. The catch fallback just shows the raw string `"22:00"` instead of a nicely formatted `"10:00 PM ET"`.

3. **No timezone displayed inline with times**: Even when the timezone is set, individual schedule item times don't show the timezone abbreviation.

## Fix

### `src/pages/ShowDetailPage.tsx` — ScheduleSection

- Replace the time formatting logic (line 216) to use `formatTimeInZone` from `timezones.ts` instead of `parseISO`. This turns `"22:00"` into `"10:00 PM"`.
- Append the timezone abbreviation inline when the show has a timezone (e.g. `"10:00 PM ET"`).
- Keep the banner as-is for context, but also make it show a fallback like "Local time" when no timezone is stored.

### `src/pages/ShowDetailPage.tsx` — Show header area

- Display the show's timezone abbreviation somewhere visible near the date/venue info so users always know which timezone applies. A small chip or label like `"ET"` next to the date.

### No other file changes needed

- The `CreateShowModal` already has a timezone picker.
- The `EditShowModal` already has a timezone picker.
- The `useCreateShow` mutation already passes `timezone`.
- The database column already exists.

## Files

| File | Change |
|------|--------|
| `src/pages/ShowDetailPage.tsx` | Fix schedule time formatting to use `formatTimeInZone`, show timezone abbreviation inline with times, show timezone label in header |

