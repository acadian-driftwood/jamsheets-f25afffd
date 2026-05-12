## Problem

Past shows are still appearing on the **Shows** tab instead of moving to the Archive after 24 hours.

The Archive page itself works correctly — `useArchivedShows` already returns shows where `date < yesterday`. The bug is in the **Shows** list, which uses `useShows()` (in `src/pages/ShowsPage.tsx`) and returns **every** show for the org regardless of date. There is no upcoming-only filter, so past shows just pile up at the top of the list.

This matches the project rule "Auto-archiving of items > 24 hours past end date" — shows should disappear from the active Shows list once their date is more than ~24 hours in the past, while remaining visible in Archive.

## Fix

**`src/pages/ShowsPage.tsx`** — filter the `useShows()` result before grouping/rendering so only shows with `date >= yesterday` (i.e. today and future, plus today-of-the-show through end of that day) appear. Yesterday is computed as `new Date(Date.now() - 86400000).toISOString().split("T")[0]`, mirroring `useArchivedShows` exactly so the two lists are perfectly complementary (no show shown in both, none lost between them).

The subtitle count (`${shows.length} upcoming`) will use the filtered length.

## Out of scope

- `useShows(tourId)` on TourDetailPage and ShowSwipeNav keeps returning all shows for that tour — past shows on a tour page are intentional context.
- `ToursPage` show-count stays as-is (counts all shows on the tour).
- No DB migration, no status column changes, no edge function — purely a frontend filter, matching how tours archiving already works.

## Files

- `src/pages/ShowsPage.tsx` (edit)
