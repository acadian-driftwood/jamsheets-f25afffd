

# Fix Plan: Invite Flow, Settings Visibility, and Team Member Display

## 1. Invite Flow -- New users land on login instead of join page

**Root cause:** In `App.tsx` line 60, the `/join` route is wrapped in `<RequireAuth>`. Unauthenticated users clicking the email link get redirected to `/login` before ever seeing the inline signup form on `JoinPage.tsx`.

**Fix:**
- **`App.tsx`**: Remove `<RequireAuth>` wrapper from the `/join` route. `JoinPage` already has its own inline auth form for unauthenticated users, so it handles both states correctly.
- Change line 60 from:
  ```
  <Route path="/join" element={<RequireAuth><OrgProvider><JoinPage /></OrgProvider></RequireAuth>} />
  ```
  to:
  ```
  <Route path="/join" element={<OrgProvider><JoinPage /></OrgProvider></Route>} />
  ```
- **`JoinPage.tsx`**: The `useOrg()` hook's `refetch` may fail if there's no authenticated user yet. Wrap the `refetch` call so it only runs after auth is confirmed. The rest of the page already handles the unauthenticated state with the inline signup/login form -- no other changes needed.

## 2. Settings visibility by role

**Current:** Band Settings and Team Members visible to all roles.
**Required:** Band Settings = Owner only. Team Members = Admin and up (owner, admin).

**Fix in `SettingsPage.tsx`:**
- Band Settings: `visible: role === "owner"`
- Team Members: `visible: isOwnerOrAdmin`

## 3. Remove user ID line from team members list

**Current:** Line 241 in `TeamMembersPage.tsx` shows `{m.user_id.slice(0, 8)}…` under each member's name.

**Fix:** Replace the user ID subtitle with the member's role label (e.g., "Member", "Admin") since the role chip already shows this, or simply remove the subtitle line entirely. Cleanest approach: remove the `<p>` tag on line 241 so each member row only shows the name and role chip.

---

## Files to change

| File | Change |
|------|--------|
| `src/App.tsx` | Remove `RequireAuth` from `/join` route |
| `src/pages/SettingsPage.tsx` | Band Settings visible owner-only, Team Members visible admin+ |
| `src/pages/settings/TeamMembersPage.tsx` | Remove user ID display from member rows |

