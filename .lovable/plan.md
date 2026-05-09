# Forgot Password Flow

Add a self-serve password recovery flow so users can reset their own passwords from the login screen.

## What changes

### 1. `src/pages/LoginPage.tsx`
- Add a fourth `mode`: `"forgot"` alongside `login | signup | magic`.
- In `login` mode, show a small **"Forgot password?"** link directly under the password field (right-aligned, muted text, accent on hover).
- In `forgot` mode:
  - Show only the email field
  - Submit calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ` `${window.location.origin}/reset-password` ` })`
  - Toast: "If an account exists for that email, we've sent a reset link."
  - Footer link: "Back to sign in" → returns to `login` mode

### 2. New page `src/pages/ResetPasswordPage.tsx`
- Public route (no `RequireAuth`).
- Supabase auto-creates a recovery session when the user lands from the email link, so the page just needs to:
  - Show two fields: New password, Confirm password (min 8 chars, must match)
  - On submit: `supabase.auth.updateUser({ password })`
  - On success: toast + `navigate("/today")` (they're already signed in via the recovery session)
  - If no session is present after a short check, show a friendly "This reset link is invalid or has expired" with a button back to `/login`
- Same minimal centered layout as `LoginPage` (logo, JamSheets header).

### 3. `src/App.tsx`
- Import `ResetPasswordPage`
- Add `<Route path="/reset-password" element={<ResetPasswordPage />} />` alongside the other public routes (`/login`, `/join`, `/unsubscribe`).

## What does not change
- No auth config changes — Supabase recovery is already enabled by default.
- No edge functions, no email template work. The default Lovable recovery email continues to be used (we can brand it later if you want).
- No database migrations.
- Existing login / signup / magic-link flows are untouched.

## Files touched
- `src/pages/LoginPage.tsx` (edit)
- `src/pages/ResetPasswordPage.tsx` (new)
- `src/App.tsx` (edit — one import + one route)
