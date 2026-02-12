/**
 * Category Service
 *
 * Provides CRUD operations for expense categories
 */

import { getDatabase } from './getDatabase';
import type { CategoryRow } from './types';
import type { Category } from '@/types';

/**
 * Convert database row to Category type
 */
function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '',
    color: row.color || '',
  };
}

/**
 * Generate a unique ID from name
 */
function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Get all categories
 *
 * @returns Promise<Category[]> - Array of all categories
 */
export async function getCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY name ASC'
  );

  return rows.map(rowToCategory);
}

/**
 * Get a category by ID
 *
 * @param id - Category ID
 * @returns Promise<Category | null> - Category object or null if not found
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  return rowToCategory(row);
}

/**
 * Create a new category
 *
 * @param category - Category data without id or with custom id
 * @returns Promise<Category> - The created category
 */
export async function createCategory(
  category: Omit<Category, 'id'> | Category
): Promise<Category> {
  const db = await getDatabase();
  const id = 'id' in category && category.id ? category.id : generateId(category.name);

  await db.runAsync(
    `
    INSERT INTO categories (id, name, icon, color)
    VALUES (?, ?, ?, ?)
  `,
    [id, category.name, category.icon, category.color]
  );

  return { id, ...category };
}

/**
 * Update a category
 *
 * @param id - Category ID
 * @param updates - Partial category data to update
 * @returns Promise<void>
 */
export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, 'id'>>
): Promise<void> {
  const db = await getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }

  values.push(id);

  if (fields.length > 0) {
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }
}

/**
 * Delete a category
 *
 * @param id - Category ID
 * @returns Promise<void>
 * @throws Error if category is in use by receipts
 */
export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();

  // Check if category is in use
  const usage = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM receipts WHERE category_id = ?',
    [id]
  );

  if (usage && usage.count > 0) {
    throw new Error(
      `Cannot delete category: ${usage.count} receipt(s) are using this category`
    );
  }

  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

/**
 * Get category usage statistics
 *
 * @returns Promise<Array> - Array of categories with receipt counts and total amounts
 */
export async function getCategoryStatistics(): Promise<
  Array<{
    category: Category;
    receiptCount: number;
    totalAmount: number;
  }>
> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<
    CategoryRow & { receipt_count: number; total_amount: number }
  >(`
    SELECT
      c.id,
      c.name,
      c.icon,
      c.color,
      COUNT(r.id) as receipt_count,
      COALESCE(SUM(r.amount), 0) as total_amount
    FROM categories c
    LEFT JOIN receipts r ON c.id = r.category_id
    GROUP BY c.id, c.name, c.icon, c.color
    ORDER BY total_amount DESC
  `);

  return rows.map((row) => ({
    category: {
      id: row.id,
      name: row.name,
      icon: row.icon || '',
      color: row.color || '',
    },
    receiptCount: row.receipt_count,
    totalAmount: row.total_amount,
  }));
}

/**
 * Check if a category name already exists
 *
 * @param name - Category name
 * @param excludeId - Optional category ID to exclude from check (for updates)
 * @returns Promise<boolean> - True if name exists
 */
export async function categoryNameExists(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const db = await getDatabase();

  let query = 'SELECT COUNT(*) as count FROM categories WHERE name = ?';
  const params: any[] = [name];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const result = await db.getFirstAsync<{ count: number }>(query, params);

  return (result?.count ?? 0) > 0;
}
