

# Fix Quick-Add Flow, Travel Type Skip, and Date Display

## Root Causes

### Issues #1 and #2: Travel type picker not being skipped
`useState` initial values only run on first mount. When the `CreateTravelModal` reopens with a new `defaultSubtype`, the `step` and `travelType` states retain their previous values. Same problem affects `departureDate` not picking up `defaultDate`. Need `useEffect` hooks to sync state when these props change.

### Issue #3: Date input grayed out and empty
Using `disabled` on the date `<Input>` grays it out and on some browsers hides the value. Should use `readOnly` instead and add a subtle style so it looks filled but non-editable. Also, the `CreateShowModal` has the same stale-state bug — `date` is initialized from `defaultDate` via `useState` but doesn't update when the prop changes on subsequent opens.

## Changes

### `src/components/modals/CreateTravelModal.tsx`
- Add `useEffect` to sync `step`, `travelType`, `title`, and `departureDate` when `defaultSubtype` or `defaultDate` change (or when `open` becomes true)
- Change date input from `disabled={!!defaultDate}` to `readOnly={!!defaultDate}` with a muted background class

### `src/components/modals/CreateShowModal.tsx`
- Add `useEffect` to sync `date` state when `defaultDate` changes or modal opens
- Change date input from `disabled={!!defaultDate}` to `readOnly={!!defaultDate}` with styling that shows the value clearly

### `src/components/modals/CreateDayOffModal.tsx`
- Add `useEffect` to sync `date` when `defaultDate` changes or modal opens
- Same `readOnly` treatment for the date input

### All three modals — date styling
Instead of `disabled` (which grays out and can hide value), use `readOnly` + `className="bg-muted cursor-default"` so the date is visible but clearly non-editable.

## Files

| File | Change |
|------|--------|
| `src/components/modals/CreateTravelModal.tsx` | Add useEffect for prop sync, readOnly date |
| `src/components/modals/CreateShowModal.tsx` | Add useEffect for date sync, readOnly date |
| `src/components/modals/CreateDayOffModal.tsx` | Add useEffect for date sync, readOnly date |

