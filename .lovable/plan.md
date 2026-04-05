

# Remove Top "Add" Button from Tour Detail Page

Remove the "+ Add" button from the page header since users can now add items directly from the timeline dates.

## Change

**`src/pages/TourDetailPage.tsx`** (lines 186–196):
- Remove the `<Button>` with `<Plus> Add` from the header action area
- Keep only the edit (pencil) button in the action slot
- The `Plus` icon import can stay since it's used elsewhere in the file (empty day rows, inline add buttons)

The action prop changes from a `<div>` containing edit + add buttons to just the edit button alone.

