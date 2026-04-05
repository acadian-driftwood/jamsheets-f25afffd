

# JamSheets Premium UI Overhaul

This is a significant visual and UX refinement across the entire app. No new features or database changes — purely front-end polish to make JamSheets feel App Store-ready.

## Overview

The app already has good bones: bottom nav, card-based layout, mobile-first structure. This plan refines typography, spacing, hierarchy, interaction patterns, and microcopy across all major screens to achieve a calm, premium, native-app feel.

---

## 1. Design System Refinements

**Files: `src/index.css`, `tailwind.config.ts`**

- Increase base spacing and breathing room in `.page-container` (more top padding, wider max-width on tablets)
- Refine `.card-elevated` with subtler borders, slightly more padding
- Add new utility classes: `.section-header` (for consistent section labels), `.timeline-dot` (for timeline indicators)
- Slightly soften border color for less visual noise
- Add a subtle `fade-in` stagger animation for card lists

## 2. Shared Components Polish

### PageHeader (`src/components/layout/PageHeader.tsx`)
- Larger title (text-3xl font-extrabold) for hero screens (Today)
- Sticky positioning with backdrop blur on detail pages
- Smaller, more refined back button

### InfoCard (`src/components/shared/InfoCard.tsx`)
- More padding (p-4 → p-5)
- Tighter chip placement
- Subtle hover/active state refinement
- Support for left-side icon/indicator dot

### StatusChip (`src/components/shared/StatusChip.tsx`)
- Slightly smaller, more refined sizing
- Add a tiny dot indicator variant for readiness cues

### EmptyState (`src/components/shared/EmptyState.tsx`)
- Warmer, more human microcopy defaults
- Slightly smaller icon container

### BottomNav (`src/components/layout/BottomNav.tsx`)
- Reduce to 5 tabs: Today, Tours, Shows, Travel, More (consolidate Archive + Settings under "More")
- Slightly taller touch targets
- Active indicator: small dot under active icon instead of color change (more native feel)

## 3. Today Page — Hero Dashboard

**File: `src/pages/TodayPage.tsx`**

Major restructure to feel like a true command center:

- **Hero greeting**: Large "Today" with full date, feels like opening an app
- **Now / Tonight section**: If there's a show today, show a prominent card with venue, city, time, and readiness indicators (small dots showing whether hotel/schedule/contacts are set)
- **Travel Today**: Compact travel items with icons, times, and type chips
- **Next Up**: Next show card with countdown-style "in X days" label
- **Needs Attention**: Show cards missing key data (no hotel, no schedule, etc.) with subtle "Add hotel" / "Add schedule" prompts
- **Quick Stats**: Cleaner layout, fewer stats, more meaningful (e.g., "3 shows this week" instead of workspace name)
- Better microcopy: "No show today" → "Day off", "No travel today" → "Nothing on the road today"

## 4. Tour Detail — Real Timeline

**File: `src/pages/TourDetailPage.tsx`**

Transform from flat card list to a proper chronological timeline:

- **Date dividers**: Bold date headers (e.g., "Fri, Jun 13") separating groups of items
- **Timeline spine**: Subtle vertical line connecting items on the left side
- **Item type indicators**: Small colored dots on the timeline spine (orange for shows, gray for travel, muted for off days)
- **Compact item cards**: Tighter layout per item — title, subtitle, time, and type chip all on one or two lines
- **Show items** get a chevron (tappable) and readiness dots
- **Travel items** show time and key detail inline
- **Off days** shown as minimal, muted single-line entries
- Move delete button into a "Danger Zone" section at the bottom
- Cleaner action bar: small icon buttons for edit, add show, add travel

## 5. Tours List Page

**File: `src/pages/ToursPage.tsx`**

- Add a small show count badge to each tour card
- Show date range more prominently
- Active tour gets a subtle accent left-border indicator

## 6. Show Detail — Operational & Beautiful

**File: `src/pages/ShowDetailPage.tsx`**

- **Hero section**: Venue name large, city + date + capacity as refined meta line
- **Readiness bar**: Row of small indicator dots/chips below the header showing which sections have data (Hotel ✓, Schedule ✓, Contacts ✗, etc.)
- **Sections reorder**: Schedule (default open) → Hotel → Contacts → Guest List → Gear/Notes → Documents → Operations
- **Section styling**: Remove heavy collapsible chrome — use clean dividers with subtle expand/collapse
- **Read mode polish**: Hotel card, contact cards, schedule list all get more breathing room and cleaner typography
- **Edit mode**: Keep inline editing but with cleaner form styling (more padding, rounded inputs)
- **Danger zone**: Move delete to very bottom, wrapped in a subtle destructive section with confirmation
- **Empty section messaging**: "No hotel yet" with small "Add hotel" link, not a full empty state
- Hide Notes & Gear section header if both are empty (already partially done)

## 7. Shows List Page

**File: `src/pages/ShowsPage.tsx`**

- Add readiness dots to each show card (tiny indicators for hotel/schedule/contacts status)
- Group shows by month with subtle month dividers
- Better empty state copy: "No upcoming shows — add one to get started"

## 8. Travel Page

**File: `src/pages/TravelPage.tsx`**

- Group travel items by date with date dividers
- Filter to only show upcoming travel (past items hidden)
- Add subtle type-specific icons inline
- Warmer empty state: "Nothing on the road yet"

## 9. Microcopy Pass

Across all pages, update labels and empty states:
- "No tours yet" → "No active tours"
- "Empty timeline" → "Nothing planned yet"
- "No upcoming shows" → "No shows coming up"
- "Request Guests" → "Add to guest list"
- Section subtitles and button labels refined throughout

## 10. Interaction Pattern Improvements

- All create/edit modals already use Dialog (slide-up on mobile) — ensure consistent `max-w-sm mx-4` sizing
- Add subtle press feedback on all tappable cards (active:scale-[0.98] transition)
- Ensure sticky header on detail pages with backdrop blur

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/index.css` | New utility classes, spacing refinements |
| `tailwind.config.ts` | Animation additions |
| `src/components/layout/PageHeader.tsx` | Sticky option, size variants |
| `src/components/layout/BottomNav.tsx` | 5-tab layout, dot indicator |
| `src/components/shared/InfoCard.tsx` | Polish, icon support |
| `src/components/shared/StatusChip.tsx` | Dot variant |
| `src/components/shared/EmptyState.tsx` | Microcopy refinements |
| `src/pages/TodayPage.tsx` | Full dashboard restructure |
| `src/pages/ToursPage.tsx` | Show count, active indicator |
| `src/pages/TourDetailPage.tsx` | Timeline with date dividers and spine |
| `src/pages/ShowDetailPage.tsx` | Readiness bar, section polish, danger zone |
| `src/pages/ShowsPage.tsx` | Readiness dots, month grouping |
| `src/pages/TravelPage.tsx` | Date grouping, upcoming filter |
| `src/pages/ArchivePage.tsx` | Minor microcopy updates |
| `src/pages/SettingsPage.tsx` | Accessed via "More" tab |

No database changes. No new dependencies. Pure front-end refinement.

