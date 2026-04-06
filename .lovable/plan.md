

# Fix Off-Day Click-Through in Non-Sortable Rendering

## Problem

There are two code paths that render off-day items on the tour timeline:
1. **Sortable path** (lines 97-112) — used when multiple items exist on the same day. This one correctly has `onClick={() => navigate(`/off-day/${item.id}`)}` and a chevron.
2. **Non-sortable path** (lines 479-483) — used when there's only one item on that day. This renders a plain static `<div>` with no click handler, so tapping does nothing.

## Fix

**`src/pages/TourDetailPage.tsx`** (lines 479-483):
- Replace the static `<div>` with a `<button>` that navigates to `/off-day/${item.id}`
- Add a `<ChevronRight>` icon to indicate it's tappable
- Match the styling from the sortable version (line 104-111)

Change from:
```tsx
<div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
  <Coffee className="h-3.5 w-3.5" />
  <span>Day off</span>
</div>
```

To:
```tsx
<button
  onClick={() => navigate(`/off-day/${item.id}`)}
  className="flex items-center gap-2 py-2 text-sm text-muted-foreground press-scale active:text-foreground transition-colors"
>
  <Coffee className="h-3.5 w-3.5" />
  <span>Day off</span>
  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
</button>
```

## Files
| File | Change |
|------|--------|
| `src/pages/TourDetailPage.tsx` | Make non-sortable off-day row clickable |

