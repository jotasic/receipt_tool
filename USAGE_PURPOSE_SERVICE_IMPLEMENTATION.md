# Usage Purpose Management Service Implementation (P0.3)

## Overview
Implemented complete CRUD service for managing usage purposes (categories) for items in the receipt tracking system.

## Files Created

### 1. `/Users/taewookim/dev/receipt_tool/types/usagePurpose.ts`
Type definitions for usage purposes including:
- `UsagePurpose` interface (main type)
- `CreateUsagePurposeInput` interface (for creation)
- `UpdateUsagePurposeInput` interface (for updates)
- Helper functions: `isDefaultUsagePurpose()`, `isValidUsagePurpose()`, `isValidCreateInput()`
- Constants: `DEFAULT_USAGE_PURPOSE_IDS` array

### 2. `/Users/taewookim/dev/receipt_tool/services/database/usagePurposeService.ts`
Complete service implementation with 11 functions:

#### Read Operations
- `getAllUsagePurposes()` - Get all purposes (active + inactive)
- `getActiveUsagePurposes()` - Get only active purposes (for dropdowns)
- `getUsagePurposeById(id)` - Get specific purpose by ID

#### Create Operation
- `createUsagePurpose(input)` - Create new purpose with validation
  - Auto-generates ID if not provided
  - Auto-assigns display_order (max + 1)
  - Validates unique names
  - Defaults is_active to 1

#### Update Operations
- `updateUsagePurpose(id, updates)` - Update specific fields
- `toggleUsagePurposeActive(id)` - Toggle is_active status
- `reorderUsagePurposes(orderedIds)` - Batch update display_order

#### Delete Operation
- `deleteUsagePurpose(id)` - Delete with validation
  - Prevents deletion of default purposes (meal, other)
  - Prevents deletion if in use by items

#### Utility Operations
- `isUsagePurposeInUse(id)` - Check if any items use it
- `getUsagePurposeUsageCount(id)` - Get count of items using it
- `getUsagePurposeStatistics()` - Get all purposes with usage counts

### 3. `/Users/taewookim/dev/receipt_tool/services/database/USAGE_PURPOSE_EXAMPLE.ts`
Comprehensive usage examples demonstrating:
- Fetching purposes
- Creating custom purposes
- Updating purposes
- Reordering
- Checking usage before deletion
- Deleting with validation
- Getting statistics
- UI management patterns
- Form validation
- Bulk operations
- Deactivating vs deleting

## Files Modified

### 1. `/Users/taewookim/dev/receipt_tool/services/database/types.ts`
Added `UsagePurposeRow` interface for database row mapping:
```typescript
export interface UsagePurposeRow {
  id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
  color: string | null;
  is_active: number;
  display_order: number;
}
```

### 2. `/Users/taewookim/dev/receipt_tool/types/index.ts`
Added exports:
```typescript
export type {
  UsagePurpose,
  CreateUsagePurposeInput,
  UpdateUsagePurposeInput,
} from './usagePurpose';
export { isDefaultUsagePurpose } from './usagePurpose';
```

### 3. `/Users/taewookim/dev/receipt_tool/services/database/index.ts`
Added exports:
- `UsagePurposeRow` type
- All 11 usage purpose service functions
- Item service functions (which were missing)

## Database Schema

The service works with the existing `usage_purposes` table:

```sql
CREATE TABLE IF NOT EXISTS usage_purposes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
)
```

Default purposes seeded:
- `meal` (식대, Meal)
- `other` (기타, Other)

## Key Features

### 1. **Snake_case ↔ camelCase Mapping**
```typescript
// Database row (snake_case)
{ name_en: 'Meal', is_active: 1, display_order: 1 }

// TypeScript object (camelCase)
{ nameEn: 'Meal', isActive: true, displayOrder: 1 }
```

### 2. **Validation**
- ✅ Prevents deleting default purposes (meal, other)
- ✅ Prevents deleting purposes in use by items
- ✅ Validates required fields (name)
- ✅ Prevents duplicate names
- ✅ Auto-generates IDs and display orders

### 3. **Auto-generation**
- ✅ UUID for id (if not provided)
- ✅ display_order = max + 1 (if not provided)
- ✅ is_active defaults to 1

### 4. **Usage Checking**
```typescript
// Check if items use this purpose
const inUse = await isUsagePurposeInUse('meal');

// Get count of items using it
const count = await getUsagePurposeUsageCount('meal');

// Get statistics for all purposes
const stats = await getUsagePurposeStatistics();
// Returns: [{ ...purpose, usageCount: 5 }, ...]
```

### 5. **Active/Inactive Management**
```typescript
// Get only active purposes (for dropdowns)
const active = await getActiveUsagePurposes();

// Toggle active status
await toggleUsagePurposeActive('meal');

// Or update directly
await updateUsagePurpose('meal', { isActive: false });
```

### 6. **Display Order Management**
```typescript
// Reorder purposes
await reorderUsagePurposes(['meal', 'transportation', 'other']);
```

## Usage Examples

### Basic CRUD

```typescript
// Import service
import {
  getActiveUsagePurposes,
  createUsagePurpose,
  updateUsagePurpose,
  deleteUsagePurpose,
} from '@/services/database';

// Get active purposes for dropdown
const purposes = await getActiveUsagePurposes();

// Create new purpose
const transport = await createUsagePurpose({
  name: '교통비',
  nameEn: 'Transportation',
  icon: 'car',
  color: '#4ECDC4',
});

// Update purpose
await updateUsagePurpose(transport.id, {
  color: '#FF6B6B',
});

// Delete (with validation)
try {
  await deleteUsagePurpose(transport.id);
} catch (error) {
  console.error('Cannot delete:', error.message);
}
```

### Creating Items with Usage Purposes

```typescript
import { createItem } from '@/services/database';

const item = await createItem({
  title: '점심 식사',
  classification: 'personal_card',
  usagePurpose: 'meal', // References usage_purposes.id
  amount: 15000,
  date: '2026-02-15',
});
```

### Managing in Settings UI

```typescript
// Get all purposes with statistics
const stats = await getUsagePurposeStatistics();

stats.forEach(purpose => {
  console.log({
    name: purpose.name,
    usageCount: purpose.usageCount,
    canDelete: !isDefaultUsagePurpose(purpose.id) && purpose.usageCount === 0,
    isActive: purpose.isActive,
  });
});
```

## Error Handling

All functions throw errors with `[Database]` prefix:

```typescript
try {
  await deleteUsagePurpose('meal');
} catch (error) {
  // Error: [Database] Failed to delete usage purpose:
  //        Cannot delete default usage purpose "meal"...
}

try {
  await createUsagePurpose({ name: '식대' });
} catch (error) {
  // Error: [Database] Failed to create usage purpose:
  //        Usage purpose with name "식대" already exists
}
```

## TypeScript Compilation

✅ All files compile without errors:
```bash
npx tsc --noEmit --skipLibCheck
# No errors
```

## Acceptance Criteria

✅ All CRUD operations work correctly
✅ Snake_case ↔ camelCase mapping implemented
✅ Cannot delete default purposes (meal, other)
✅ Cannot delete purposes in use by items
✅ TypeScript compiles without errors
✅ Follows existing service patterns (tagService, itemService)
✅ Proper error handling with [Database] prefix
✅ Auto-generation for ID and display_order
✅ Comprehensive examples provided

## Integration Points

### 1. **Items Table**
```sql
-- items.usage_purpose references usage_purposes.id
SELECT * FROM items WHERE usage_purpose = 'meal';
```

### 2. **UI Dropdowns**
```typescript
// Get active purposes for select inputs
const purposes = await getActiveUsagePurposes();
```

### 3. **Settings/Admin**
```typescript
// Full management with statistics
const stats = await getUsagePurposeStatistics();
```

### 4. **Validation**
```typescript
import { isDefaultUsagePurpose } from '@/types';

if (isDefaultUsagePurpose(id)) {
  // Show warning: cannot delete default purpose
}
```

## Next Steps

To use this service in the app:

1. **Import the service:**
   ```typescript
   import {
     getActiveUsagePurposes,
     createUsagePurpose,
     // ... other functions
   } from '@/services/database';
   ```

2. **For item creation forms:**
   - Fetch active purposes: `getActiveUsagePurposes()`
   - Display in dropdown/selector
   - Use selected ID when creating items

3. **For settings/management screen:**
   - Fetch statistics: `getUsagePurposeStatistics()`
   - Show list with usage counts
   - Enable/disable purposes
   - Delete unused custom purposes

4. **For reporting:**
   - Group items by usage purpose
   - Filter items by purpose
   - Show totals per purpose

## Related Files

- Database schema: `/Users/taewookim/dev/receipt_tool/services/database/schema.ts`
- Item service: `/Users/taewookim/dev/receipt_tool/services/database/itemService.ts`
- Item types: `/Users/taewookim/dev/receipt_tool/types/item.ts`
- Tag service: `/Users/taewookim/dev/receipt_tool/services/database/tagService.ts`
