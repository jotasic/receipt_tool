/**
 * Usage Purpose Service - Usage Examples
 *
 * This file demonstrates how to use the usage purpose management service.
 * These examples show common patterns for managing usage purposes in the app.
 */

import {
  getAllUsagePurposes,
  getActiveUsagePurposes,
  getUsagePurposeById,
  createUsagePurpose,
  updateUsagePurpose,
  toggleUsagePurposeActive,
  reorderUsagePurposes,
  deleteUsagePurpose,
  isUsagePurposeInUse,
  getUsagePurposeUsageCount,
  getUsagePurposeStatistics,
} from './usagePurposeService';

// ============================================================================
// Example 1: Fetching Usage Purposes
// ============================================================================

async function exampleGetUsagePurposes() {
  // Get all usage purposes (active and inactive)
  const allPurposes = await getAllUsagePurposes();
  console.log('All purposes:', allPurposes);

  // Get only active purposes (for dropdowns/selectors)
  const activePurposes = await getActiveUsagePurposes();
  console.log('Active purposes:', activePurposes);

  // Get a specific purpose by ID
  const mealPurpose = await getUsagePurposeById('meal');
  console.log('Meal purpose:', mealPurpose);
}

// ============================================================================
// Example 2: Creating Custom Usage Purposes
// ============================================================================

async function exampleCreateCustomPurpose() {
  // Create a new usage purpose with all fields
  const transportationPurpose = await createUsagePurpose({
    name: '교통비',
    nameEn: 'Transportation',
    icon: 'car',
    color: '#4ECDC4',
    // displayOrder is auto-assigned if not provided
  });
  console.log('Created transportation purpose:', transportationPurpose);

  // Create with minimal data (only name is required)
  const customPurpose = await createUsagePurpose({
    name: '접대비',
  });
  console.log('Created custom purpose:', customPurpose);

  // Create with specific ID and display order
  const specificPurpose = await createUsagePurpose({
    id: 'medical',
    name: '의료비',
    nameEn: 'Medical',
    icon: 'medical',
    color: '#FCBAD3',
    displayOrder: 3,
  });
  console.log('Created medical purpose:', specificPurpose);
}

// ============================================================================
// Example 3: Updating Usage Purposes
// ============================================================================

async function exampleUpdatePurpose() {
  // Update specific fields only
  const updated = await updateUsagePurpose('meal', {
    color: '#FF6B6B',
    icon: 'restaurant',
  });
  console.log('Updated meal purpose:', updated);

  // Update name and English name
  await updateUsagePurpose('other', {
    name: '기타 지출',
    nameEn: 'Other Expenses',
  });

  // Toggle active status
  const toggled = await toggleUsagePurposeActive('meal');
  console.log('Toggled active status:', toggled);

  // Toggle back
  await toggleUsagePurposeActive('meal');
}

// ============================================================================
// Example 4: Reordering Usage Purposes
// ============================================================================

async function exampleReorderPurposes() {
  // Define the desired order
  const desiredOrder = [
    'meal',           // Display order: 1
    'transportation', // Display order: 2
    'medical',        // Display order: 3
    'other',          // Display order: 4
  ];

  await reorderUsagePurposes(desiredOrder);
  console.log('Usage purposes reordered');

  // Verify the new order
  const purposes = await getAllUsagePurposes();
  purposes.forEach((p) => {
    console.log(`${p.name} - Order: ${p.displayOrder}`);
  });
}

// ============================================================================
// Example 5: Checking Usage Before Deletion
// ============================================================================

async function exampleCheckUsageBeforeDelete() {
  const purposeId = 'transportation';

  // Check if the purpose is in use
  const inUse = await isUsagePurposeInUse(purposeId);

  if (inUse) {
    // Get the usage count
    const count = await getUsagePurposeUsageCount(purposeId);
    console.log(`Cannot delete: ${count} items are using this purpose`);

    // User must reassign or delete those items first
    return;
  }

  // Safe to delete
  await deleteUsagePurpose(purposeId);
  console.log('Purpose deleted successfully');
}

// ============================================================================
// Example 6: Deleting Usage Purposes with Validation
// ============================================================================

async function exampleDeletePurpose() {
  try {
    // This will fail - cannot delete default purposes
    await deleteUsagePurpose('meal');
  } catch (error) {
    console.error('Error:', error);
    // Error: Cannot delete default usage purpose "meal". You can deactivate it instead.
  }

  try {
    // Create a custom purpose
    const custom = await createUsagePurpose({
      id: 'entertainment',
      name: '엔터테인먼트',
      nameEn: 'Entertainment',
    });

    // This will succeed (if not in use)
    await deleteUsagePurpose('entertainment');
    console.log('Custom purpose deleted');
  } catch (error) {
    console.error('Error:', error);
    // Error: Cannot delete usage purpose that is in use by items...
  }
}

// ============================================================================
// Example 7: Getting Usage Statistics
// ============================================================================

async function exampleGetStatistics() {
  // Get all purposes with their usage counts
  const statistics = await getUsagePurposeStatistics();

  console.log('Usage Purpose Statistics:');
  statistics.forEach((stat) => {
    console.log(`${stat.name} (${stat.nameEn || 'N/A'}): ${stat.usageCount} items`);
    console.log(`  Active: ${stat.isActive}`);
    console.log(`  Color: ${stat.color}`);
    console.log(`  Order: ${stat.displayOrder}`);
  });
}

// ============================================================================
// Example 8: Managing Usage Purposes in UI
// ============================================================================

async function exampleUIManagement() {
  // For a settings/management screen
  const allPurposes = await getUsagePurposeStatistics();

  // Display in a list with:
  // - Name (Korean and English)
  // - Usage count (to show which are in use)
  // - Active toggle (enable/disable)
  // - Delete button (disabled if in use or default)

  for (const purpose of allPurposes) {
    const canDelete = !purpose.isActive && purpose.usageCount === 0;
    console.log({
      name: purpose.name,
      nameEn: purpose.nameEn,
      usageCount: purpose.usageCount,
      isActive: purpose.isActive,
      canDelete,
    });
  }
}

// ============================================================================
// Example 9: Creating Items with Usage Purposes
// ============================================================================

async function exampleCreateItemWithPurpose() {
  // Import from itemService
  const { createItem } = await import('./itemService');

  // Get active purposes for dropdown
  const activePurposes = await getActiveUsagePurposes();
  console.log('Available purposes:', activePurposes.map((p) => p.name));

  // Create an item with a usage purpose
  const item = await createItem({
    title: '점심 식사',
    classification: 'personal_card',
    usagePurpose: 'meal', // Reference to usage_purposes table
    amount: 15000,
    date: '2026-02-15',
    storeName: '한식당',
  });
  console.log('Created item:', item);
}

// ============================================================================
// Example 10: Form Validation
// ============================================================================

async function exampleFormValidation() {
  // Validate before creating
  const name = '  교통비  ';

  // Trim and check for empty
  if (!name.trim()) {
    throw new Error('Name is required');
  }

  try {
    await createUsagePurpose({
      name: name.trim(),
      nameEn: 'Transportation',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.error('A purpose with this name already exists');
    } else {
      console.error('Failed to create purpose:', error);
    }
  }
}

// ============================================================================
// Example 11: Bulk Operations
// ============================================================================

async function exampleBulkOperations() {
  // Create multiple purposes
  const purposesToCreate = [
    { name: '교통비', nameEn: 'Transportation', icon: 'car', color: '#4ECDC4' },
    { name: '의료비', nameEn: 'Medical', icon: 'medical', color: '#FCBAD3' },
    { name: '접대비', nameEn: 'Entertainment', icon: 'film', color: '#F38181' },
  ];

  const created = [];
  for (const purpose of purposesToCreate) {
    try {
      const result = await createUsagePurpose(purpose);
      created.push(result);
    } catch (error) {
      console.error(`Failed to create ${purpose.name}:`, error);
    }
  }

  console.log(`Created ${created.length} purposes`);
}

// ============================================================================
// Example 12: Deactivating Instead of Deleting
// ============================================================================

async function exampleDeactivateInsteadOfDelete() {
  // For default purposes or purposes with many items,
  // deactivate instead of deleting

  const purposeId = 'meal';

  // Check if it's a default purpose
  const { isDefaultUsagePurpose } = await import('@/types/usagePurpose');

  if (isDefaultUsagePurpose(purposeId)) {
    // Deactivate instead of delete
    const updated = await updateUsagePurpose(purposeId, {
      isActive: false,
    });
    console.log('Default purpose deactivated:', updated);
  }

  // Active purposes won't show in dropdowns
  const activePurposes = await getActiveUsagePurposes();
  console.log('Active purposes (meal should not be here):', activePurposes);

  // But all purposes still accessible
  const allPurposes = await getAllUsagePurposes();
  console.log('All purposes (meal should be here):', allPurposes);
}

// Export example functions for potential testing
export {
  exampleGetUsagePurposes,
  exampleCreateCustomPurpose,
  exampleUpdatePurpose,
  exampleReorderPurposes,
  exampleCheckUsageBeforeDelete,
  exampleDeletePurpose,
  exampleGetStatistics,
  exampleUIManagement,
  exampleCreateItemWithPurpose,
  exampleFormValidation,
  exampleBulkOperations,
  exampleDeactivateInsteadOfDelete,
};
