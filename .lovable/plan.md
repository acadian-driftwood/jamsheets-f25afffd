

# Fix: Invite Link Blank Page on First Click

## Root Cause

The `/join` route wraps `JoinPage` in `<OrgProvider>`. `OrgProvider` calls `useAuth()` which depends on `AuthContext` resolving the session. On a cold first load (clicking the email link), there's a race condition: the Supabase client's `onAuthStateChange` fires `INITIAL_SESSION` before `getSession` fully resolves from storage. During this window, the page can render blank or flash before settling.

Additionally, `OrgProvider` is unnecessary for unauthenticated users on the join page -- it only provides `refetch` which is called after join succeeds.

## Fix

**`src/App.tsx`**: Remove `OrgProvider` wrapper from the `/join` route entirely. JoinPage doesn't need org context until after the user has joined.

```
<Route path="/join" element={<JoinPage />} />
```

**`src/pages/JoinPage.tsx`**:
- Remove `useOrg()` dependency. Instead of calling `refetch()` after join, just navigate to `/today` -- the main app shell already wraps routes in `OrgProvider` which will fetch orgs on mount.
- Store the org ID in localStorage (already done) so `OrgProvider` picks it up when `/today` loads.
- Remove the `import { useOrg }` line.

This eliminates the blank page because:
1. No `OrgProvider` means no cascading context dependencies for unauthenticated users
2. The page renders the signup form immediately after `AuthContext.loading` resolves
3. After signup + join, navigation to `/today` triggers the normal authenticated app shell

## Files

| File | Change |
|------|--------|
| `src/App.tsx` | Remove `OrgProvider` from `/join` route |
| `src/pages/JoinPage.tsx` | Remove `useOrg()`, navigate directly after join |

