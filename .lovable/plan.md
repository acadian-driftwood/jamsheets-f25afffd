

# Drag-to-Reorder Timeline Items Within a Day

## Overview

Add the ability for privileged users (owner/admin/tm) to reorder multiple items on the same day via drag-and-drop, with a six-dot grip handle indicating draggability.

## Database Migration

Add a `sort_order` column to both tables that contribute items to the timeline:

```sql
ALTER TABLE public.shows ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.tour_timeline_items ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
```

No RLS changes needed — existing update policies already cover privileged roles.

## Frontend Changes

### TourDetailPage.tsx

- Install and use `@dnd-kit/core` + `@dnd-kit/sortable` for accessible drag-and-drop (lightweight, touch-friendly, React-native)
- Within each day that has 2+ items, wrap the items list in a `SortableContext`
- Each item card gets wrapped in a sortable wrapper
- Show a 6-dot grip icon (`GripVertical` from lucide) on the left side of each item card — only visible to privileged users
- On drag end: reorder the items array for that day, then persist the new `sort_order` values via batch updates to `shows` and/or `tour_timeline_items` as appropriate
- Single-item days show no grip handle

### Sorting logic in merged items

- Update the `merged` memo to sort by `date` first, then `sort_order` ascending
- When creating new items, assign `sort_order` = count of existing items on that date (append to end)

### Files to modify

| File | Change |
|------|--------|
| **Migration** | Add `sort_order` to `shows` and `tour_timeline_items` |
| `src/pages/TourDetailPage.tsx` | Add dnd-kit sortable within each day group, grip handle, persist reorder |
| `src/components/modals/CreateShowModal.tsx` | Pass `sort_order` when inserting |
| `src/components/modals/CreateTravelModal.tsx` | Pass `sort_order` when inserting |
| `src/components/modals/CreateDayOffModal.tsx` | Pass `sort_order` when inserting |
| `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

## UX Details

- Grip handle: `GripVertical` icon (6 dots), muted color, left of the item icon
- Only rendered for privileged users (`isPrivileged`)
- Touch-friendly: dnd-kit supports touch sensors out of the box
- Items with only one entry on a day: no grip shown
- Visual feedback during drag: slight scale/shadow lift on the dragged card

