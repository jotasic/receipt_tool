# Technical Debt

Known issues and inconsistencies identified during development.
These are internal tracking notes — not user-facing bugs.

---

## Active

_(none)_

---

## Resolved

### [TD-001] UsagePurposeSelector uses hardcoded constants instead of DB

**Files**:
- `components/item/UsagePurposeSelector.tsx`
- `services/database/usagePurposeService.ts`

**Problem**: The management screen wrote to DB, but the item form selector read from a hardcoded `USAGE_PURPOSES` constant. Changes in the management screen had no effect on the item form.

**Fix**: `UsagePurposeSelector` completely rewritten to use `getActiveUsagePurposes(spaceId)` from DB. Added loading and empty states.

**Resolved in**: `refactor(settings/tags/usagePurposes): Space별 독립 설정 구조로 재편`

---

### [TD-002] Tags and UsagePurposes queried globally despite being designed as space-scoped

**Design intent**: Spaces are independent units — tags, usage purposes, and classifications all belong to a specific space.

**Problem**: Both tags and usage purposes had `space_id` in DB and services supported filtering, but all call sites ignored the `spaceId` parameter. Tags and usage purposes from one space bled into all others.

**Fix**:
1. `getTags(currentSpace?.id)` passed at all call sites (TagSelector, tags.tsx, items/index.tsx)
2. `getActiveUsagePurposes(spaceId)` passed at all call sites (UsagePurposeSelector, usage-purposes.tsx)
3. `createTag({ ..., spaceId })` and `createUsagePurpose({ ..., spaceId })` pass space on creation
4. `ItemForm.tsx` passes `spaceId={currentSpace?.id}` to both TagSelector and UsagePurposeSelector

**Resolved in**: `refactor(settings/tags/usagePurposes): Space별 독립 설정 구조로 재편`

---

### [TD-003] Settings tab violates global vs. space-scoped separation

**Original design intent**: Settings are split into two distinct layers:
- **Global** (app-wide, space-agnostic): theme, backup, data management, space management
- **Space-scoped** (per current space): classifications, tags, usage purposes, custom fields

**Space management belongs exclusively in SpaceDrawer** — it is a global operation that affects all spaces.

**Problem**:
1. Space management appeared in settings tab
2. Classification/tag/usage-purpose management ignored `currentSpace`
3. No clear separation between global vs. space-scoped sections

**Fix**:
1. Removed "공간 관리" section from `settings/index.tsx`
2. Deleted `settings/spaces.tsx` — space management only via SpaceDrawer
3. `settings/classifications.tsx`: SegmentedControl removed, now uses `useSpaceStore().currentSpace`
4. `settings/tags.tsx`: scoped to `currentSpace.id`
5. `settings/usage-purposes.tsx`: scoped to `currentSpace.id`

**Resolved in**: `refactor(settings/tags/usagePurposes): Space별 독립 설정 구조로 재편`
