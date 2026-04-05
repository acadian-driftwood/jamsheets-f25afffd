

# Multi-Band Switching for Manager Plan

## Current state

The infrastructure for multiple organizations already exists:
- `OrgContext` fetches all orgs a user belongs to and stores them in `organizations[]`
- `setCurrentOrgId()` switches the active org and persists to localStorage
- A user can already be an `owner` of multiple organizations in `organization_members`

What's **missing**: there's no UI to create additional bands or switch between them, and the onboarding flow only runs when a user has zero orgs.

## How it works

- **Owner on Manager plan**: Can create additional bands and switch freely between them. All data is scoped per-org via RLS, so switching orgs changes all visible tours/shows/travel.
- **Invited members**: They only appear in `organization_members` for the band they were invited to. They never see the switcher (they belong to one org). Their data is isolated by RLS.
- **Free/Band plans**: Creating additional bands is blocked. The switcher is hidden if you only have one org.

## Plan

### 1. Add "Create New Band" capability (Manager only)

On the **More** page, below the current org card, add a **"Create New Band"** button visible only to users whose current org is on the Manager plan. Tapping opens a sheet/modal with a band name input — same logic as `OnboardingPage` but without navigating away. After creation, the user is added as owner and the new org gets a Free subscription (they can upgrade it separately, or we link it to the parent Manager subscription — starting simple with independent subscriptions).

### 2. Add org switcher to More page

Replace the static org card at the top of the More page with a tappable org switcher:
- Shows current band name + role
- Tapping opens a sheet listing all orgs the user belongs to
- Each row shows band name and role badge
- Selecting one calls `setCurrentOrgId()` which re-scopes all data
- Only appears as interactive if `organizations.length > 1`

### 3. Gate "Create New Band" behind Manager plan

In the switcher sheet or More page:
- If current plan is Manager: show "Create New Band" button at the bottom of the org list
- If not Manager but user has multiple orgs (edge case): still show switcher, but no create button
- If Free/Band with one org: show the org card as-is (no switcher affordance)

### 4. Backend enforcement

Add a `check_workspace_limit()` database function:
- Free: max 1 org owned
- Band: max 1 org owned  
- Manager: unlimited (or cap at a reasonable number like 10)

Check this before allowing org creation. The check counts orgs where the user is `owner`, cross-referenced with their highest plan tier.

### Files changed

| File | Change |
|------|--------|
| `src/pages/MorePage.tsx` | Add org switcher card + "Create New Band" button |
| `src/components/modals/OrgSwitcherSheet.tsx` | New — sheet listing all orgs with switch + create |
| `src/hooks/useSubscription.ts` | Add `workspaces` limit to `PLAN_LIMITS` (already has the field) |
| `src/contexts/OrgContext.tsx` | No changes needed — already supports multi-org |
| Migration | Add `check_workspace_limit()` function |

### UX flow

```text
More page (Manager, 2+ bands):
┌─────────────────────────┐
│ 🎵 The Midnight Riders  │
│    owner · Band plan     │
│              ▾ Switch    │
├─────────────────────────┤
│ Archive            →     │
│ Settings           →     │
│ Profile            →     │
│ Sign Out                 │
└─────────────────────────┘

Tapping "Switch" opens sheet:
┌─────────────────────────┐
│ Your Bands              │
│                         │
│ ● The Midnight Riders   │
│   The Side Project   →  │
│                         │
│ + Create New Band       │
└─────────────────────────┘
```

Non-owner members with one org see no switcher. The card is static, as it is today.

