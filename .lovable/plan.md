

# Tour Creation + Show Swipe Navigation

## Overview

Two UX improvements: (1) make tour creation timeline-first with required dates, and (2) add swipe navigation between shows within a tour.

---

## 1. Timeline-First Tour Creation

### CreateTourModal changes
- Make start date and end date **required** fields
- Validate end date >= start date, show inline error if not
- On successful creation, navigate to `/tours/{newTourId}` immediately (currently just closes the modal)
- Return the created tour data from the mutation so we can navigate

### TourDetailPage — full-date-range timeline
- Instead of only showing days that have items, render **every day** in the tour's start-to-end date range
- Each day gets a row in the timeline; days with no items show a subtle "empty" state with a quick-add button
- Quick-add button on empty days opens a picker: Show / Flight / Rental Car / Driving / Day Off
- Visual distinction per day type:
  - **Show day**: orange accent dot/left border
  - **Travel day** (flight/driving/rental): blue or warning styling (existing)
  - **Off day**: muted/gray with coffee icon
  - **Empty day**: dashed border, light background, "Nothing planned" text
- Show a summary bar at top: "12 days · 6 shows · 3 travel · 2 off · 1 empty"
- Keep all existing timeline functionality (spine, date dividers, item cards)

### Quick-add day sheet
- New component: a small bottom sheet or popover that appears when tapping "+" on an empty day
- Pre-fills the date for the selected day
- Options: Show, Flight, Rental Car, Driving, Day Off
- Tapping an option opens the corresponding existing modal (CreateShowModal, CreateTravelModal, CreateDayOffModal) with the date pre-filled

### Modal date pre-fill
- Update CreateShowModal, CreateTravelModal, and CreateDayOffModal to accept an optional `defaultDate` prop
- When provided, pre-fill the date field with that value

---

## 2. Swipe Navigation Between Tour Shows

### ShowDetailPage changes
- If the show has a `tour_id`, fetch all shows for that tour (sorted by date)
- Determine current show index and total count
- Display "Show 3 of 8" indicator below the header
- Show subtle prev/next arrows or chevrons at edges

### Swipe implementation
- Use `embla-carousel-react` (already installed for the carousel component) to wrap the show content in a swipeable container
- Three slides: previous show, current show, next show
- On swipe complete, navigate to the new show URL (`/shows/{id}`)
- Prefetch adjacent show data using `queryClient.prefetchQuery` for instant transitions

### Navigation indicator
- Small pill below the header: `← The Fillmore | Show 3 of 8 | The Ryman →`
- Tapping left/right text navigates to that show
- On first/last show, hide the corresponding arrow

---

## Files to create/modify

| File | Change |
|------|--------|
| `src/components/modals/CreateTourModal.tsx` | Require dates, validate, navigate on success |
| `src/pages/TourDetailPage.tsx` | Full date-range timeline, empty days, quick-add, summary bar |
| `src/components/tour/QuickAddSheet.tsx` | **New** — day-type picker for empty days |
| `src/components/modals/CreateShowModal.tsx` | Add `defaultDate` prop |
| `src/components/modals/CreateTravelModal.tsx` | Add `defaultDate` prop |
| `src/components/modals/CreateDayOffModal.tsx` | Add `defaultDate` prop |
| `src/pages/ShowDetailPage.tsx` | Tour show sequence indicator + swipe navigation |
| `src/hooks/useData.ts` | No changes needed (useShows with tourId already exists) |

---

## Technical notes

- `eachDayOfInterval` from date-fns generates every day between tour start/end
- Embla carousel is already a project dependency — reuse for swipe
- Prefetch via `queryClient.prefetchQuery({ queryKey: ["show", adjacentId] })` 
- Swipe uses `onSelect` callback from Embla to trigger `navigate()` after settling
- No database changes required — all data structures already support this

