

# Hide Past Tours from Tours Page

## Current behavior
- `useTours()` fetches all tours for the org with no date/status filtering
- Archive page only shows past **shows**, not past tours

## Plan

### 1. Filter tours in `useTours()` hook (`src/hooks/useData.ts`)
Add a filter to exclude tours whose `end_date` is before yesterday (same 24-hour grace period used for archived shows). Tours with no `end_date` or a future `end_date` remain visible. Also exclude tours with `status = 'completed'` or `status = 'archived'`.

### 2. Add archived tours to Archive page (`src/pages/ArchivePage.tsx`)
Create a `useArchivedTours()` hook that returns tours where `end_date < yesterday` OR `status` is `completed`/`archived`. Display them in a separate section above or below the archived shows list.

### Files changed

| File | Change |
|------|--------|
| `src/hooks/useData.ts` | Filter `useTours()` to exclude past/completed tours; add `useArchivedTours()` hook |
| `src/pages/ArchivePage.tsx` | Add archived tours section |

