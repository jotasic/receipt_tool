# Category System Deprecation Summary

## Overview

The legacy category system has been deprecated in favor of the 2D classification system (ItemClassification × UsagePurpose). This document tracks the deprecation status and cleanup progress.

**Date:** 2024-02-15
**Status:** ✅ Deprecation Complete - Awaiting Legacy Data Cleanup

## What Changed

### Old System (Deprecated)
- Single-dimension categorization
- `categories` table with predefined categories (식비, 교통비, etc.)
- Used in `receipts` table via `category_id` foreign key
- Managed via `categoryService.ts`

### New System (Current)
- 2D classification: `classification` × `usagePurpose`
- **Classification** dimension: `personal_card`, `corporate_card`, `proof_document`
- **UsagePurpose** dimension: `meal`, `other`, + user-defined
- Used in `items` table
- Managed via `usagePurposeService.ts`

## Deprecation Checklist

### ✅ Completed

- [x] **Schema deprecation** (`/services/database/schema.ts`)
  - Added deprecation comment to `categories` table definition
  - Added deprecation comment to `DEFAULT_CATEGORIES` constant

- [x] **Service deprecation** (`/services/database/categoryService.ts`)
  - Added file-level deprecation notice
  - Added `@deprecated` JSDoc to all exported functions:
    - `getCategories()`
    - `getCategoryById()`
    - `createCategory()`
    - `updateCategory()`
    - `deleteCategory()`
    - `getCategoryStatistics()`
    - `categoryNameExists()`

- [x] **Type deprecation** (`/types/category.ts`)
  - Added file-level deprecation notice
  - Added `@deprecated` JSDoc to `Category` interface

- [x] **Database types deprecation** (`/services/database/types.ts`)
  - Added `@deprecated` JSDoc to `CategoryRow` interface

- [x] **Constants deprecation** (`/constants/categories.ts`)
  - Added deprecation comment to `DEFAULT_CATEGORIES` export

- [x] **Index exports deprecation** (`/services/database/index.ts`)
  - Added deprecation comment to category service exports
  - Added deprecation comment to `DEFAULT_CATEGORIES` export

- [x] **Migration guide** (`/docs/MIGRATION_GUIDE.md`)
  - Added comprehensive Category System Migration section
  - Documented before/after patterns
  - Explained rationale and benefits

- [x] **Architecture documentation** (`/docs/ARCHITECTURE.md`)
  - Updated Legacy Category System section
  - Clarified deprecation status
  - Added migration strategy notes

- [x] **Cleanup utilities** (`/services/database/cleanup.ts`)
  - Created `hasLegacyCategoryData()` - Check if categories are still in use
  - Created `removeCategoryTable()` - Safe removal with validation
  - Created `getLegacyReceiptCount()` - Count legacy receipts
  - Created `getCategoryTableCount()` - Count categories
  - Created `getCleanupStatus()` - Get overall cleanup status

### ⚠️ Remaining Work (Optional Future Cleanup)

- [ ] **Legacy data migration**
  - Check if any legacy receipts still reference categories
  - Migrate remaining legacy receipts to items table
  - Run cleanup status check: `getCleanupStatus()`

- [ ] **Table removal** (only after migration complete)
  - Verify no receipts reference `category_id`: `hasLegacyCategoryData()`
  - Remove `categories` table: `removeCategoryTable()`
  - Remove `category_id` foreign key from `receipts` table

- [ ] **Code removal** (only after table removal)
  - Delete `/services/database/categoryService.ts`
  - Delete `/types/category.ts`
  - Delete `/constants/categories.ts`
  - Remove category exports from `/services/database/index.ts`
  - Remove `CategoryRow` from `/services/database/types.ts`
  - Update tests that use categories

## Files Changed

### Modified Files

1. `/services/database/schema.ts`
   - Added deprecation comments to `categories` table and `DEFAULT_CATEGORIES`

2. `/services/database/categoryService.ts`
   - Added file-level and function-level deprecation notices

3. `/types/category.ts`
   - Added deprecation notices to interface

4. `/services/database/types.ts`
   - Added deprecation to `CategoryRow`

5. `/constants/categories.ts`
   - Added deprecation comment

6. `/services/database/index.ts`
   - Added deprecation comments to exports

7. `/docs/MIGRATION_GUIDE.md`
   - Added Category System Migration section

8. `/docs/ARCHITECTURE.md`
   - Updated Legacy Category System documentation

### New Files

1. `/services/database/cleanup.ts`
   - Cleanup utilities for legacy data

2. `/docs/CATEGORY_DEPRECATION_SUMMARY.md`
   - This file

## Usage Examples

### For Developers

**Old Code (Deprecated):**
```typescript
import { getCategories } from '@/services/database/categoryService';

const categories = await getCategories();
// Will show deprecation warning in IDE
```

**New Code (Recommended):**
```typescript
import { getActiveUsagePurposes } from '@/services/database/usagePurposeService';

const purposes = await getActiveUsagePurposes();
```

### For Database Cleanup

**Check cleanup status:**
```typescript
import { getCleanupStatus } from '@/services/database';

const status = await getCleanupStatus();
console.log(status);
// {
//   legacyReceiptsWithCategories: 0,
//   totalCategories: 8,
//   canRemoveCategoryTable: true,
//   recommendation: "Safe to remove category table..."
// }
```

**Remove category table (when ready):**
```typescript
import { removeCategoryTable } from '@/services/database';

// Only works if no receipts reference categories
await removeCategoryTable();
```

## Backward Compatibility

### Current State

- Legacy `categories` table: **Still exists**
- Legacy `categoryService`: **Still functional** but deprecated
- Legacy `receipts` with `category_id`: **Still supported**

### Migration Path

1. **Phase 1 (Current)**: Deprecation markers added, both systems coexist
2. **Phase 2 (Future)**: Migrate all legacy receipts to items
3. **Phase 3 (Future)**: Remove category table and service code

### No Breaking Changes

- All existing code continues to work
- Legacy receipts can still be read
- Category service still functional
- No data loss

## Testing

After deprecation:
- ✅ TypeScript compilation passes without errors
- ✅ Deprecated warnings appear in IDE
- ✅ Legacy receipt data (if any) still loads correctly
- ✅ New items don't reference categories
- ✅ Documentation is clear about migration

## References

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#category-system-migration) - Migration guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture overview
- `/services/database/cleanup.ts` - Cleanup utilities
- `/services/database/usagePurposeService.ts` - New usage purpose service

## Notes

- **Don't delete anything yet**: Keep legacy code for backward compatibility
- **Deprecation only**: Mark as deprecated, don't remove
- **Clear migration path**: Documentation provides clear guidance
- **IDE support**: TypeScript `@deprecated` tags show warnings in editors
