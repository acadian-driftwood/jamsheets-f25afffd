

# Add Role Editing for Team Members

## Problem
Admins and owners can currently see each member's role as a static chip, but cannot change it. The only options are to remove a member or invite new ones.

## Solution
Replace the static `StatusChip` with an inline `Select` dropdown for each non-owner member (when the viewer is an admin/owner). Selecting a new role triggers an update to `organization_members`.

### `src/pages/settings/TeamMembersPage.tsx`

1. **Add role update handler**: A function `handleRoleChange(memberId, newRole)` that calls `supabase.from("organization_members").update({ role: newRole }).eq("id", memberId)`, then invalidates the `org-members` query and shows a toast.

2. **Replace static chip with Select for editable members**: In the members list, for rows where the viewer is admin/owner and the member is not the owner:
   - Replace `<StatusChip label={m.role} ... />` with a `<Select>` dropdown pre-filled with the current role
   - Options: Admin, TM, Member, Crew, Read-only (same as the invite role picker)
   - Owner role is not selectable (ownership transfer is out of scope)
   - For the owner row (or if viewer lacks permission), keep the static `StatusChip`

3. **Prevent self-demotion**: If the member's `user_id` matches the current user, disable the role selector to prevent accidental self-demotion.

### No database or RLS changes needed
The existing "Admins can update members" RLS policy already permits owners and admins to update `organization_members` rows.

## Files

| File | Change |
|------|--------|
| `src/pages/settings/TeamMembersPage.tsx` | Add role change handler, replace static chip with Select dropdown for editable members |

