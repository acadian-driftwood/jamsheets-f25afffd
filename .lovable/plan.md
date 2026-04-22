

# Simplify Rental Car Round-Trip Return

## Change

For round-trip **rental cars**, only require a **Return Date** — drop the second "Arrival Date / Time" pair (the return-leg arrival fields). Flights keep both since landing time matters; rentals only need the date you bring the car back.

## Files

### `src/components/modals/CreateTravelModal.tsx`
- In the round-trip "Return Leg" block (lines 362–388), when `travelType === "rental"`:
  - Render only **Return Date** + optional **Return Time** (the dropoff time).
  - Hide the second grid (Arrival Date / Arrival Time) — flights still show it.
- Relabel the rental return field to **"Dropoff Date"** for clarity.
- Submit logic at line 197 already uses `returnDepartureDate` as `dropoffDate` — no change needed.

### `src/components/modals/EditTravelModal.tsx`
- No changes (it edits a single timeline row at a time, not paired legs).

## Notes

- Flight round-trip behavior is unchanged.
- Existing rental records already use `returnDepartureDate` → `rental_return` row; no migration needed.

