

# Add Inline Editing for Schedule Items

## Problem
Schedule items display their time and title but offer no way to edit them — only delete. The `useUpdateScheduleItem` hook already exists in `useData.ts` but is never used.

## Fix

### `src/pages/ShowDetailPage.tsx` — ScheduleSection

Make each schedule row tappable to enter an inline edit mode (similar to the existing "adding" flow):

- **Tap a row** to select it for editing. The row transforms into editable inputs: a `time` input (pre-filled with the current `starts_at`) and a text input (pre-filled with the current `title`).
- Show **Save** (check) and **Cancel** (X) buttons, replacing the delete button while editing.
- On save, call `useUpdateScheduleItem` with the updated `title`, `starts_at`, and `show_id`.
- Only one row can be in edit mode at a time.

### Import change
Add `useUpdateScheduleItem` to the existing import from `useData`.

## Files

| File | Change |
|------|--------|
| `src/pages/ShowDetailPage.tsx` | Add edit state and inline editing UI to ScheduleSection, import `useUpdateScheduleItem` |

