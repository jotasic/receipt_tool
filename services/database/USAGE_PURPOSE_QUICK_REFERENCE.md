# Usage Purpose Service - Quick Reference

## Import

```typescript
import {
  // Read
  getAllUsagePurposes,
  getActiveUsagePurposes,
  getUsagePurposeById,

  // Create
  createUsagePurpose,

  // Update
  updateUsagePurpose,
  toggleUsagePurposeActive,
  reorderUsagePurposes,

  // Delete
  deleteUsagePurpose,

  // Utility
  isUsagePurposeInUse,
  getUsagePurposeUsageCount,
  getUsagePurposeStatistics,
} from '@/services/database';

import type {
  UsagePurpose,
  CreateUsagePurposeInput,
  UpdateUsagePurposeInput,
} from '@/types';

import { isDefaultUsagePurpose } from '@/types';
```

## Common Patterns

### 1. Populate Dropdown (Item Creation Form)

```typescript
const purposes = await getActiveUsagePurposes();

// Display in dropdown
<Select>
  {purposes.map(p => (
    <Option key={p.id} value={p.id}>
      {p.name} {p.nameEn && `(${p.nameEn})`}
    </Option>
  ))}
</Select>
```

### 2. Settings/Management Screen

```typescript
const stats = await getUsagePurposeStatistics();

stats.forEach(purpose => {
  const isDefault = isDefaultUsagePurpose(purpose.id);
  const inUse = purpose.usageCount > 0;
  const canDelete = !isDefault && !inUse;

  // Render list item with:
  // - Name (Korean + English)
  // - Usage count badge
  // - Active toggle switch
  // - Delete button (disabled if !canDelete)
});
```

### 3. Create New Purpose

```typescript
// Minimal (name only)
const purpose = await createUsagePurpose({
  name: '교통비',
});

// Full options
const purpose = await createUsagePurpose({
  name: '교통비',
  nameEn: 'Transportation',
  icon: 'car',
  color: '#4ECDC4',
  displayOrder: 2,
});
```

### 4. Update Purpose

```typescript
// Update color
await updateUsagePurpose(id, { color: '#FF6B6B' });

// Update name
await updateUsagePurpose(id, {
  name: '교통/주차비',
  nameEn: 'Transportation & Parking',
});

// Toggle active
await toggleUsagePurposeActive(id);
```

### 5. Delete with Validation

```typescript
try {
  await deleteUsagePurpose(id);
  showSuccess('Deleted successfully');
} catch (error) {
  if (error.message.includes('default')) {
    showError('Cannot delete default purpose');
  } else if (error.message.includes('in use')) {
    showError('Purpose is being used by items');
  } else {
    showError('Delete failed');
  }
}
```

### 6. Reorder (Drag & Drop)

```typescript
// After user reorders in UI
const newOrder = ['meal', 'transportation', 'medical', 'other'];
await reorderUsagePurposes(newOrder);
```

### 7. Check Before Action

```typescript
// Before deleting
const inUse = await isUsagePurposeInUse(id);
if (inUse) {
  const count = await getUsagePurposeUsageCount(id);
  showWarning(`${count} items are using this purpose`);
  return;
}

await deleteUsagePurpose(id);
```

## Data Structure

### UsagePurpose
```typescript
{
  id: string;              // e.g., 'meal'
  name: string;            // e.g., '식대'
  nameEn: string | null;   // e.g., 'Meal'
  icon: string | null;     // e.g., 'restaurant'
  color: string | null;    // e.g., '#FF6B6B'
  isActive: boolean;       // true/false
  displayOrder: number;    // 1, 2, 3...
}
```

### With Statistics
```typescript
{
  ...UsagePurpose,
  usageCount: number;      // Number of items using this
}
```

## Default Purposes

```typescript
const DEFAULT_PURPOSES = ['meal', 'other'];

// Check if default
isDefaultUsagePurpose('meal');  // true
isDefaultUsagePurpose('custom'); // false
```

## Validation Rules

- ✅ Name is required and must be unique
- ✅ Cannot delete default purposes (meal, other)
- ✅ Cannot delete purposes in use by items
- ✅ ID auto-generated if not provided
- ✅ displayOrder auto-assigned if not provided
- ✅ isActive defaults to true

## Error Messages

```typescript
// Duplicate name
"Usage purpose with name 'XXX' already exists"

// Not found
"Usage purpose with ID 'XXX' not found"

// Cannot delete default
"Cannot delete default usage purpose 'XXX'. You can deactivate it instead."

// Cannot delete in use
"Cannot delete usage purpose that is in use by items. Please reassign or delete those items first."
```

## Best Practices

1. **Use active purposes for dropdowns**
   ```typescript
   const purposes = await getActiveUsagePurposes();
   ```

2. **Show usage counts in management UI**
   ```typescript
   const stats = await getUsagePurposeStatistics();
   ```

3. **Deactivate instead of delete**
   ```typescript
   // For default or heavily-used purposes
   await updateUsagePurpose(id, { isActive: false });
   ```

4. **Validate before delete**
   ```typescript
   const inUse = await isUsagePurposeInUse(id);
   const isDefault = isDefaultUsagePurpose(id);

   if (isDefault || inUse) {
     // Show error
   } else {
     // OK to delete
   }
   ```

5. **Handle errors gracefully**
   ```typescript
   try {
     await createUsagePurpose({ name });
   } catch (error) {
     // Show user-friendly message
   }
   ```

## Performance Tips

- Cache `getActiveUsagePurposes()` result in forms
- Use `getUsagePurposeStatistics()` instead of multiple calls
- Batch reorder operations with `reorderUsagePurposes()`

## Related Services

- **Items**: `getItemsByUsagePurpose(purposeId)`
- **Reports**: Filter items by purpose in reports
- **Statistics**: Group totals by purpose

## Testing

```typescript
// Test creation
const purpose = await createUsagePurpose({
  name: 'Test Purpose',
});
assert(purpose.id);
assert(purpose.isActive === true);

// Test update
await updateUsagePurpose(purpose.id, { color: '#000' });
const updated = await getUsagePurposeById(purpose.id);
assert(updated?.color === '#000');

// Test delete
await deleteUsagePurpose(purpose.id);
const deleted = await getUsagePurposeById(purpose.id);
assert(deleted === null);
```
