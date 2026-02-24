/**
 * Item Service
 *
 * Provides CRUD operations for the unified items table.
 * Items represent all expense-related documents (receipts, proofs, etc.)
 * with a 2D classification system: ItemClassification × UsagePurpose
 */

import { getDatabase } from './getDatabase';
import type { ItemRow } from './types';
import type { Item, ItemClassification, UsagePurpose } from '@/types/item';

/**
 * Convert database row to Item type
 */
function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    title: row.title,
    classification: row.classification,
    usagePurpose: row.usage_purpose,
    spaceId: row.space_id ?? undefined,
    classificationId: row.classification_id ?? undefined,
    amount: row.amount ?? undefined,
    date: row.date,
    storeName: row.store_name ?? undefined,
    filePath: row.file_path ?? undefined,
    fileType: row.file_type ?? undefined,
    ocrText: row.ocr_text ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Create a new item
 *
 * @param item - Item data without id, createdAt, updatedAt
 * @returns Promise<Item> - The created item with generated fields
 * @throws Error with [Database] prefix if database operation fails
 */
export async function createItem(
  item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Item> {
  try {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `
      INSERT INTO items (
        id, title, classification, usage_purpose, amount, date,
        store_name, file_path, file_type, ocr_text, memo,
        space_id, classification_id,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        item.title,
        item.classification,
        item.usagePurpose,
        item.amount ?? null,
        item.date,
        item.storeName ?? null,
        item.filePath ?? null,
        item.fileType ?? null,
        item.ocrText ?? null,
        item.memo ?? null,
        item.spaceId ?? null,
        item.classificationId ?? null,
        now,
        now,
      ]
    );

    return {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to create item: ${errorMessage}`);
  }
}

/**
 * Get all items, optionally filtered by space
 *
 * @param spaceId - Optional space ID to filter by; omit for all items
 * @returns Promise<Item[]> - Array of items ordered by date descending
 */
export async function getItems(spaceId?: string): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE space_id = ? ORDER BY date DESC, created_at DESC',
          [spaceId]
        )
      : await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY date DESC, created_at DESC');

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get items: ${errorMessage}`);
  }
}

/**
 * Get all items with their tags in 2 queries (instead of 1+N)
 *
 * @param spaceId - Optional space ID to filter by; omit for all items
 * @returns Promise<Item[]> - Array of items with tags, ordered by date descending
 */
export async function getItemsWithTags(spaceId?: string): Promise<Item[]> {
  try {
    const db = await getDatabase();

    // Query 1: fetch all items (optionally filtered by space)
    const itemRows = spaceId
      ? await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE space_id = ? ORDER BY date DESC, created_at DESC',
          [spaceId]
        )
      : await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY date DESC, created_at DESC');

    if (itemRows.length === 0) return [];

    // Query 2: fetch all tags for all items at once via IN clause
    const itemIds = itemRows.map((r) => r.id);
    const placeholders = itemIds.map(() => '?').join(',');
    const tagRows = await db.getAllAsync<{
      item_id: string;
      tag_id: string;
      tag_name: string;
      tag_color: string;
      tag_created_at: string;
    }>(
      `SELECT it.item_id, t.id AS tag_id, t.name AS tag_name, t.color AS tag_color, t.created_at AS tag_created_at
       FROM tags t
       INNER JOIN item_tags it ON t.id = it.tag_id
       WHERE it.item_id IN (${placeholders})
       ORDER BY t.name ASC`,
      itemIds
    );

    // Group tags by item_id
    const tagsByItemId: Record<string, { id: string; name: string; color: string; createdAt: string }[]> = {};
    for (const row of tagRows) {
      if (!tagsByItemId[row.item_id]) tagsByItemId[row.item_id] = [];
      tagsByItemId[row.item_id].push({
        id: row.tag_id,
        name: row.tag_name,
        color: row.tag_color,
        createdAt: row.tag_created_at,
      });
    }

    return itemRows.map((row) => ({
      ...rowToItem(row),
      tags: tagsByItemId[row.id] ?? [],
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get items with tags: ${errorMessage}`);
  }
}

/**
 * Get an item by ID
 *
 * @param id - Item ID
 * @returns Promise<Item | null> - Item object or null if not found
 */
export async function getItemById(id: string): Promise<Item | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ItemRow>(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );

    if (!row) {
      return null;
    }

    return rowToItem(row);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get item by ID: ${errorMessage}`);
  }
}

/**
 * Update an item
 *
 * @param id - Item ID
 * @param updates - Partial item data to update
 * @returns Promise<void>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function updateItem(
  id: string,
  updates: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    // Build dynamic UPDATE query based on provided fields
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.classification !== undefined) {
      fields.push('classification = ?');
      values.push(updates.classification);
    }
    if (updates.usagePurpose !== undefined) {
      fields.push('usage_purpose = ?');
      values.push(updates.usagePurpose);
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount ?? null);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.storeName !== undefined) {
      fields.push('store_name = ?');
      values.push(updates.storeName ?? null);
    }
    if (updates.filePath !== undefined) {
      fields.push('file_path = ?');
      values.push(updates.filePath ?? null);
    }
    if (updates.fileType !== undefined) {
      fields.push('file_type = ?');
      values.push(updates.fileType ?? null);
    }
    if (updates.ocrText !== undefined) {
      fields.push('ocr_text = ?');
      values.push(updates.ocrText ?? null);
    }
    if (updates.memo !== undefined) {
      fields.push('memo = ?');
      values.push(updates.memo ?? null);
    }
    if (updates.spaceId !== undefined) {
      fields.push('space_id = ?');
      values.push(updates.spaceId ?? null);
    }
    if (updates.classificationId !== undefined) {
      fields.push('classification_id = ?');
      values.push(updates.classificationId ?? null);
    }

    // Always update updated_at
    fields.push('updated_at = ?');
    values.push(now);

    // Add id for WHERE clause
    values.push(id);

    if (fields.length > 0) {
      const query = `UPDATE items SET ${fields.join(', ')} WHERE id = ?`;
      await db.runAsync(query, values);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to update item: ${errorMessage}`);
  }
}

/**
 * Move an item to a different space
 *
 * Resets classificationId to null since the target space may have
 * a different classification schema.
 *
 * @param id - Item ID
 * @param targetSpaceId - Target space ID
 * @returns Promise<void>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function moveItemToSpace(id: string, targetSpaceId: string): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE items SET space_id = ?, classification_id = NULL, usage_purpose = \'\', updated_at = ? WHERE id = ?',
      [targetSpaceId, now, id]
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to move item: ${errorMessage}`);
  }
}

/**
 * Delete an item
 *
 * @param id - Item ID
 * @returns Promise<void>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function deleteItem(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to delete item: ${errorMessage}`);
  }
}

/**
 * Get items by classification
 *
 * @param classification - Item classification to filter by
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of items with the specified classification
 */
export async function getItemsByClassification(
  classification: ItemClassification,
  spaceId?: string
): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE classification = ? AND space_id = ? ORDER BY date DESC, created_at DESC',
          [classification, spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE classification = ? ORDER BY date DESC, created_at DESC',
          [classification]
        );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get items by classification: ${errorMessage}`);
  }
}

/**
 * Get items by usage purpose
 *
 * @param usagePurpose - Usage purpose to filter by
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of items with the specified usage purpose
 */
export async function getItemsByUsagePurpose(
  usagePurpose: UsagePurpose,
  spaceId?: string
): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE usage_purpose = ? AND space_id = ? ORDER BY date DESC, created_at DESC',
          [usagePurpose, spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE usage_purpose = ? ORDER BY date DESC, created_at DESC',
          [usagePurpose]
        );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get items by usage purpose: ${errorMessage}`);
  }
}

/**
 * Get items by date range
 *
 * @param startDate - Start date (ISO string: YYYY-MM-DD)
 * @param endDate - End date (ISO string: YYYY-MM-DD)
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of items within date range
 */
export async function getItemsByDateRange(
  startDate: string,
  endDate: string,
  spaceId?: string
): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE date >= ? AND date <= ? AND space_id = ? ORDER BY date DESC, created_at DESC',
          [startDate, endDate, spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC',
          [startDate, endDate]
        );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get items by date range: ${errorMessage}`);
  }
}

/**
 * Search items by title, store name, or memo
 *
 * @param query - Search query
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of matching items
 */
export async function searchItems(query: string, spaceId?: string): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const searchPattern = `%${query}%`;
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          `SELECT * FROM items
           WHERE (title LIKE ? OR store_name LIKE ? OR memo LIKE ?) AND space_id = ?
           ORDER BY date DESC, created_at DESC`,
          [searchPattern, searchPattern, searchPattern, spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          `SELECT * FROM items
           WHERE title LIKE ? OR store_name LIKE ? OR memo LIKE ?
           ORDER BY date DESC, created_at DESC`,
          [searchPattern, searchPattern, searchPattern]
        );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to search items: ${errorMessage}`);
  }
}

/**
 * Get total amount by usage purpose
 *
 * Only counts items that have an amount value (excludes proof documents without amounts).
 *
 * @param usagePurpose - Usage purpose to filter by
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<number> - Total amount for the specified usage purpose
 */
export async function getTotalByUsagePurpose(
  usagePurpose: UsagePurpose,
  spaceId?: string
): Promise<number> {
  try {
    const db = await getDatabase();
    const result = spaceId
      ? await db.getFirstAsync<{ total: number | null }>(
          'SELECT SUM(amount) as total FROM items WHERE usage_purpose = ? AND space_id = ? AND amount IS NOT NULL',
          [usagePurpose, spaceId]
        )
      : await db.getFirstAsync<{ total: number | null }>(
          'SELECT SUM(amount) as total FROM items WHERE usage_purpose = ? AND amount IS NOT NULL',
          [usagePurpose]
        );

    return result?.total ?? 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get total by usage purpose: ${errorMessage}`);
  }
}

/**
 * Get total amount by classification
 *
 * Only counts items that have an amount value.
 *
 * @param classification - Classification to filter by
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<number> - Total amount for the specified classification
 */
export async function getTotalByClassification(
  classification: ItemClassification,
  spaceId?: string
): Promise<number> {
  try {
    const db = await getDatabase();
    const result = spaceId
      ? await db.getFirstAsync<{ total: number | null }>(
          'SELECT SUM(amount) as total FROM items WHERE classification = ? AND space_id = ? AND amount IS NOT NULL',
          [classification, spaceId]
        )
      : await db.getFirstAsync<{ total: number | null }>(
          'SELECT SUM(amount) as total FROM items WHERE classification = ? AND amount IS NOT NULL',
          [classification]
        );

    return result?.total ?? 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get total by classification: ${errorMessage}`);
  }
}

/**
 * Get items by combined classification and usage purpose
 *
 * Useful for querying specific combinations like "personal_card + meal" expenses.
 *
 * @param classification - Classification to filter by
 * @param usagePurpose - Usage purpose to filter by
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of items matching both criteria
 */
export async function getItemsByClassificationAndPurpose(
  classification: ItemClassification,
  usagePurpose: UsagePurpose,
  spaceId?: string
): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE classification = ? AND usage_purpose = ? AND space_id = ? ORDER BY date DESC, created_at DESC',
          [classification, usagePurpose, spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE classification = ? AND usage_purpose = ? ORDER BY date DESC, created_at DESC',
          [classification, usagePurpose]
        );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get items by classification and purpose: ${errorMessage}`);
  }
}

/**
 * Get total amount by combined classification and usage purpose
 *
 * @param classification - Classification to filter by
 * @param usagePurpose - Usage purpose to filter by
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<number> - Total amount for the specified criteria
 */
export async function getTotalByClassificationAndPurpose(
  classification: ItemClassification,
  usagePurpose: UsagePurpose,
  spaceId?: string
): Promise<number> {
  try {
    const db = await getDatabase();
    const result = spaceId
      ? await db.getFirstAsync<{ total: number | null }>(
          `SELECT SUM(amount) as total
           FROM items
           WHERE classification = ? AND usage_purpose = ? AND space_id = ? AND amount IS NOT NULL`,
          [classification, usagePurpose, spaceId]
        )
      : await db.getFirstAsync<{ total: number | null }>(
          `SELECT SUM(amount) as total
           FROM items
           WHERE classification = ? AND usage_purpose = ? AND amount IS NOT NULL`,
          [classification, usagePurpose]
        );

    return result?.total ?? 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get total by classification and purpose: ${errorMessage}`);
  }
}

/**
 * Get items requiring submission (personal_card only)
 *
 * Returns only personal card items that need to be submitted for reimbursement.
 *
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of items requiring submission
 */
export async function getItemsRequiringSubmission(spaceId?: string): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          "SELECT * FROM items WHERE classification = 'personal_card' AND space_id = ? ORDER BY date DESC, created_at DESC",
          [spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          "SELECT * FROM items WHERE classification = 'personal_card' ORDER BY date DESC, created_at DESC"
        );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get items requiring submission: ${errorMessage}`);
  }
}

/**
 * Get expense items (excludes proof documents)
 *
 * Returns items with financial data (personal_card or corporate_card).
 *
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of expense items
 */
export async function getExpenseItems(spaceId?: string): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          "SELECT * FROM items WHERE classification IN ('personal_card', 'corporate_card') AND space_id = ? ORDER BY date DESC, created_at DESC",
          [spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          "SELECT * FROM items WHERE classification IN ('personal_card', 'corporate_card') ORDER BY date DESC, created_at DESC"
        );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get expense items: ${errorMessage}`);
  }
}

/**
 * Get proof documents only
 *
 * Returns items classified as proof documents (medical statements, certificates, etc.).
 *
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of proof document items
 */
export async function getProofDocuments(spaceId?: string): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          "SELECT * FROM items WHERE classification = 'proof_document' AND space_id = ? ORDER BY date DESC, created_at DESC",
          [spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          "SELECT * FROM items WHERE classification = 'proof_document' ORDER BY date DESC, created_at DESC"
        );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get proof documents: ${errorMessage}`);
  }
}

/**
 * Get items by classification ID (Phase 2 - DB-backed classification)
 *
 * @param classificationId - Classification ID from the classifications table
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Item[]> - Array of items with the specified classificationId
 */
export async function getItemsByClassificationId(
  classificationId: string,
  spaceId?: string
): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE classification_id = ? AND space_id = ? ORDER BY date DESC, created_at DESC',
          [classificationId, spaceId]
        )
      : await db.getAllAsync<ItemRow>(
          'SELECT * FROM items WHERE classification_id = ? ORDER BY date DESC, created_at DESC',
          [classificationId]
        );
    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get items by classification ID: ${errorMessage}`);
  }
}

/**
 * Get items by space ID
 *
 * Alias for getItems(spaceId) - provided for explicit intent.
 *
 * @param spaceId - Space ID to filter by
 * @returns Promise<Item[]> - Array of items within the specified space
 */
export async function getItemsBySpace(spaceId: string): Promise<Item[]> {
  return getItems(spaceId);
}
