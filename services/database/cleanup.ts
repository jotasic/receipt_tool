/**
 * Database Cleanup Utilities
 *
 * Functions for cleaning up deprecated legacy data
 */

import { getDatabase } from './getDatabase';

/**
 * Check if legacy categories table has any data referenced by receipts
 *
 * @returns Promise<boolean> - True if any receipts still reference categories
 */
export async function hasLegacyCategoryData(): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM receipts WHERE category_id IS NOT NULL'
  );
  return (result?.count || 0) > 0;
}

/**
 * Remove unused category table (WARNING: Destructive)
 *
 * Only call this if you're sure no legacy receipts exist that reference categories.
 * This function will throw an error if any receipts still reference the category table.
 *
 * @throws Error if category table is still in use by receipts
 * @returns Promise<void>
 */
export async function removeCategoryTable(): Promise<void> {
  const hasData = await hasLegacyCategoryData();
  if (hasData) {
    throw new Error(
      'Cannot remove category table: Legacy receipts still reference it. ' +
      'Migrate or delete legacy receipts first.'
    );
  }

  const db = await getDatabase();
  await db.runAsync('DROP TABLE IF EXISTS categories');
  console.log('✅ Category table removed successfully');
}

/**
 * Get count of legacy receipts using categories
 *
 * @returns Promise<number> - Number of receipts with category_id
 */
export async function getLegacyReceiptCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM receipts WHERE category_id IS NOT NULL'
  );
  return result?.count || 0;
}

/**
 * Get count of items in the categories table
 *
 * @returns Promise<number> - Total number of categories defined
 */
export async function getCategoryTableCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  return result?.count || 0;
}

/**
 * Get cleanup status summary
 *
 * @returns Promise<object> - Cleanup status information
 */
export async function getCleanupStatus(): Promise<{
  legacyReceiptsWithCategories: number;
  totalCategories: number;
  canRemoveCategoryTable: boolean;
  recommendation: string;
}> {
  const legacyReceiptsWithCategories = await getLegacyReceiptCount();
  const totalCategories = await getCategoryTableCount();
  const canRemoveCategoryTable = legacyReceiptsWithCategories === 0;

  let recommendation = '';
  if (canRemoveCategoryTable) {
    recommendation = 'Safe to remove category table - no legacy data references it.';
  } else {
    recommendation = `Cannot remove category table yet - ${legacyReceiptsWithCategories} receipt(s) still reference it. Migrate legacy receipts to items first.`;
  }

  return {
    legacyReceiptsWithCategories,
    totalCategories,
    canRemoveCategoryTable,
    recommendation,
  };
}
