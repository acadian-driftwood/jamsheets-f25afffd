
Fix the missing path into the existing delete screen for travel items.

What’s actually broken
- The delete/detail page already exists (`src/pages/TravelDetailPage.tsx`) and the `/travel/:id` route is already registered.
- The main gap is `src/pages/TravelPage.tsx`: each travel row is rendered as an `InfoCard` without `onClick`, so it becomes a plain `div` instead of a tappable card.
- There is also one unfinished timeline case in `src/pages/TourDetailPage.tsx`: off-day rows still render as static text, so they cannot reach the same delete view either.

Implementation
1. Wire up Travel tab navigation
- Update `src/pages/TravelPage.tsx`
- Add `useNavigate`
- Pass `onClick={() => navigate(\`/travel/${item.id}\`)}` to each `InfoCard`
- Reuse the existing `InfoCard` click treatment so the whole card becomes tappable and shows the chevron automatically

2. Finish timeline item navigation
- Update `src/pages/TourDetailPage.tsx`
- Make off-day rows open `/travel/:id` too, instead of rendering as non-clickable text
- Keep the drag grip separate so privileged users can still reorder without accidental navigation

3. Keep the delete flow as-is
- Leave `src/pages/TravelDetailPage.tsx` as the delete surface
- No database changes are needed; the current Danger Zone logic already handles deletion

Files
- `src/pages/TravelPage.tsx`
- `src/pages/TourDetailPage.tsx`

Technical details
- Root cause: `InfoCard` only becomes clickable when `onClick` is provided; TravelPage never supplies it today.
- This is a UI wiring fix, not a backend issue.
- After this, users will be able to tap into travel from the Travel tab, and timeline-only items will also consistently open the detail/delete page.
