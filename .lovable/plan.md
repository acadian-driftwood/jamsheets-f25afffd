

# Fix Guest List Not Displaying

## Problem

The `useShowGuestList` query joins on `profiles!show_guest_list_entries_requested_by_fkey`, but the foreign key `show_guest_list_entries_requested_by_fkey` actually references `auth.users`, not `public.profiles`. This causes the PostgREST query to fail silently (or return an error that React Query swallows), so `guests` stays `undefined` and nothing renders.

## Fix

### `src/hooks/useData.ts` — Fix the join in `useShowGuestList`

Replace the explicit FK hint `profiles!show_guest_list_entries_requested_by_fkey` with a manual approach: fetch guest entries without the join, then look up requester names separately — or, more simply, remove the FK hint and use the correct relationship.

Since `requested_by` references `auth.users` (not `profiles`), PostgREST cannot auto-join to `profiles` via that FK. Two options:

**Option A (recommended)**: Remove the embedded join entirely. Fetch guest entries plain, and separately resolve requester names from the `profiles` table using the `requested_by` UUIDs. This avoids FK dependency issues.

**Option B**: Add a new FK from `show_guest_list_entries.requested_by` to `profiles.id` (since `profiles.id` mirrors `auth.users.id`). Then the existing join syntax would work. This requires a migration.

I recommend **Option A** — it's simpler and doesn't require a database change.

The query becomes:
```ts
const { data, error } = await supabase
  .from("show_guest_list_entries")
  .select("*")
  .eq("show_id", showId)
  .order("created_at");
```

Then in `GuestListSection`, replace `(entry.requester as any)?.full_name` with a lookup or just show "Member" for non-self entries. Alternatively, do a second query for profiles.

**Simplest path**: Just drop the join. The only place `requester` is used is line 380, which already falls back to `"Member"`. Self-requests show "You" via the `user.id` check. So removing the join loses nothing meaningful.

### No other changes needed

The rendering logic in `GuestListSection` is correct — it just never gets data because the query fails.

## Files

| File | Change |
|------|--------|
| `src/hooks/useData.ts` | Remove the broken `profiles` join from `useShowGuestList`, select `*` only |

