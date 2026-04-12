

# Fix Hotel Info Not Saving / Displaying

## Root Cause

The `useShowHotel` hook uses `.maybeSingle()`, which throws an error when more than one row is returned. Show `72eeb527` already has **6 duplicate hotel records**, so the query fails silently and the hotel section appears empty. The user then tries to add a hotel again, creating yet another duplicate — a vicious cycle.

The underlying issue: the data model assumes one hotel per show, but nothing enforces that constraint. Each "save" creates a new insert instead of updating the existing record (because the query fails, `hotel` is always `undefined`, so `hotel?.id` is never passed to the upsert).

## Fix

### 1. `src/hooks/useData.ts` — Change `maybeSingle()` to `limit(1)` + first element

Replace `.maybeSingle()` with `.order("created_at", { ascending: false }).limit(1)` and return `data?.[0] ?? null`. This prevents the query from throwing when duplicates exist, and always returns the most recent hotel record.

### 2. Database migration — Add unique constraint and clean duplicates

- Delete duplicate hotel rows, keeping only the most recent per show.
- Add a unique constraint on `(show_id)` to prevent future duplicates.

### 3. No UI changes needed

The `HotelSection` component and `useUpsertHotel` logic are correct — they just never work because the query always fails on shows with duplicates.

## Files

| File | Change |
|------|--------|
| `src/hooks/useData.ts` | Replace `.maybeSingle()` with `.limit(1)` + array access in `useShowHotel` |
| Migration | Clean duplicate hotel rows, add unique constraint on `show_hotels(show_id)` |

