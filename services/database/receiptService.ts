/**
 * Receipt Service
 *
 * Provides CRUD operations for receipts and receipt items
 */

import { getDatabase } from './getDatabase';
import type { ReceiptRow, ReceiptItemRow } from './types';
import type { Receipt, ReceiptItem } from '@/types';

/**
 * Convert database row to Receipt type
 */
function rowToReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    title: row.title,
    storeName: row.store_name || '',
    amount: row.amount,
    date: row.date,
    category: row.category_id || '',
    imagePath: row.image_path || undefined,
    ocrText: row.ocr_text || undefined,
    receiptType: row.receipt_type || 'corporate',
    memo: row.memo || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to ReceiptItem type
 */
function rowToReceiptItem(row: ReceiptItemRow): ReceiptItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    quantity: row.quantity,
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Validate category ID exists in database
 * @param categoryId - Category ID to validate
 * @returns Promise<string | null> - Valid category ID or null if not found
 */
async function validateCategoryId(categoryId: string | undefined | null): Promise<string | null> {
  if (!categoryId) return null;

  const db = await getDatabase();
  const result = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM categories WHERE id = ?',
    [categoryId]
  );

  if (!result) {
    console.warn(`Category '${categoryId}' not found in database, setting to null`);
    return null;
  }

  return result.id;
}

/**
 * Create a new receipt
 *
 * @param receipt - Receipt data without id, createdAt, updatedAt
 * @returns Promise<Receipt> - The created receipt with generated fields
 * @throws Error with [Database] prefix if database operation fails
 */
export async function createReceipt(
  receipt: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Receipt> {
  try {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    // Validate category exists to avoid FK constraint error
    const validCategoryId = await validateCategoryId(receipt.category);

    await db.runAsync(
      `
      INSERT INTO receipts (id, title, store_name, amount, date, category_id, image_path, ocr_text, receipt_type, memo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        receipt.title,
        receipt.storeName || null,
        receipt.amount,
        receipt.date,
        validCategoryId,
        receipt.imagePath || null,
        receipt.ocrText || null,
        receipt.receiptType || 'corporate',
        receipt.memo || null,
        now,
        now,
      ]
    );

    // Create items if provided
    if (receipt.items && receipt.items.length > 0) {
      for (const item of receipt.items) {
        await createReceiptItem(id, item);
      }
    }

    return {
      ...receipt,
      id,
      category: validCategoryId || '',
      createdAt: now,
      updatedAt: now,
      receiptType: receipt.receiptType || 'corporate',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to create receipt: ${errorMessage}`);
  }
}

/**
 * Get all receipts
 *
 * @returns Promise<Receipt[]> - Array of all receipts ordered by date
 */
export async function getReceipts(): Promise<Receipt[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReceiptRow>(
    'SELECT * FROM receipts ORDER BY date DESC'
  );

  // Fetch items for each receipt
  const receipts: Receipt[] = [];
  for (const row of rows) {
    const receipt = rowToReceipt(row);
    const items = await getReceiptItems(receipt.id);
    receipt.items = items;
    receipts.push(receipt);
  }

  return receipts;
}

/**
 * Get a receipt by ID
 *
 * @param id - Receipt ID
 * @returns Promise<Receipt | null> - Receipt object or null if not found
 */
export async function getReceiptById(id: string): Promise<Receipt | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReceiptRow>(
    'SELECT * FROM receipts WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  const receipt = rowToReceipt(row);
  receipt.items = await getReceiptItems(id);

  return receipt;
}

/**
 * Update a receipt
 *
 * @param id - Receipt ID
 * @param updates - Partial receipt data to update
 * @returns Promise<void>
 */
export async function updateReceipt(
  id: string,
  updates: Partial<Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Build dynamic UPDATE query based on provided fields
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.storeName !== undefined) {
    fields.push('store_name = ?');
    values.push(updates.storeName);
  }
  if (updates.amount !== undefined) {
    fields.push('amount = ?');
    values.push(updates.amount);
  }
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  if (updates.category !== undefined) {
    const validCategoryId = await validateCategoryId(updates.category);
    fields.push('category_id = ?');
    values.push(validCategoryId);
  }
  if (updates.imagePath !== undefined) {
    fields.push('image_path = ?');
    values.push(updates.imagePath);
  }
  if (updates.ocrText !== undefined) {
    fields.push('ocr_text = ?');
    values.push(updates.ocrText);
  }
  if (updates.receiptType !== undefined) {
    fields.push('receipt_type = ?');
    values.push(updates.receiptType);
  }
  if (updates.memo !== undefined) {
    fields.push('memo = ?');
    values.push(updates.memo);
  }

  // Always update updated_at
  fields.push('updated_at = ?');
  values.push(now);

  // Add id for WHERE clause
  values.push(id);

  if (fields.length > 0) {
    const query = `UPDATE receipts SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }

  // Update items if provided
  if (updates.items !== undefined) {
    // Delete existing items
    await db.runAsync('DELETE FROM receipt_items WHERE receipt_id = ?', [id]);

    // Insert new items
    for (const item of updates.items) {
      await createReceiptItem(id, item);
    }
  }
}

/**
 * Delete a receipt
 *
 * @param id - Receipt ID
 * @returns Promise<void>
 */
export async function deleteReceipt(id: string): Promise<void> {
  const db = await getDatabase();

  // Foreign key cascade will automatically delete receipt_items
  await db.runAsync('DELETE FROM receipts WHERE id = ?', [id]);
}

/**
 * Get receipts by category
 *
 * @param categoryId - Category ID
 * @returns Promise<Receipt[]> - Array of receipts in the category
 */
export async function getReceiptsByCategory(categoryId: string): Promise<Receipt[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReceiptRow>(
    'SELECT * FROM receipts WHERE category_id = ? ORDER BY date DESC',
    [categoryId]
  );

  const receipts: Receipt[] = [];
  for (const row of rows) {
    const receipt = rowToReceipt(row);
    receipt.items = await getReceiptItems(receipt.id);
    receipts.push(receipt);
  }

  return receipts;
}

/**
 * Get receipts by date range
 *
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Promise<Receipt[]> - Array of receipts within date range
 */
export async function getReceiptsByDateRange(
  startDate: string,
  endDate: string
): Promise<Receipt[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReceiptRow>(
    'SELECT * FROM receipts WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate]
  );

  const receipts: Receipt[] = [];
  for (const row of rows) {
    const receipt = rowToReceipt(row);
    receipt.items = await getReceiptItems(receipt.id);
    receipts.push(receipt);
  }

  return receipts;
}

/**
 * Search receipts by title or store name
 *
 * @param query - Search query
 * @returns Promise<Receipt[]> - Array of matching receipts
 */
export async function searchReceipts(query: string): Promise<Receipt[]> {
  const db = await getDatabase();
  const searchPattern = `%${query}%`;
  const rows = await db.getAllAsync<ReceiptRow>(
    'SELECT * FROM receipts WHERE title LIKE ? OR store_name LIKE ? ORDER BY date DESC',
    [searchPattern, searchPattern]
  );

  const receipts: Receipt[] = [];
  for (const row of rows) {
    const receipt = rowToReceipt(row);
    receipt.items = await getReceiptItems(receipt.id);
    receipts.push(receipt);
  }

  return receipts;
}

// ============================================================================
// Receipt Items Operations
// ============================================================================

/**
 * Create a receipt item
 *
 * @param receiptId - Receipt ID
 * @param item - Item data without id or with existing id
 * @returns Promise<ReceiptItem> - The created item
 */
export async function createReceiptItem(
  receiptId: string,
  item: Omit<ReceiptItem, 'id'> | ReceiptItem
): Promise<ReceiptItem> {
  const db = await getDatabase();
  const id = 'id' in item && item.id ? item.id : generateId();

  await db.runAsync(
    `
    INSERT INTO receipt_items (id, receipt_id, name, price, quantity)
    VALUES (?, ?, ?, ?, ?)
  `,
    [id, receiptId, item.name, item.price, item.quantity]
  );

  return { id, ...item };
}

/**
 * Get all items for a receipt
 *
 * @param receiptId - Receipt ID
 * @returns Promise<ReceiptItem[]> - Array of receipt items
 */
export async function getReceiptItems(receiptId: string): Promise<ReceiptItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReceiptItemRow>(
    'SELECT * FROM receipt_items WHERE receipt_id = ?',
    [receiptId]
  );

  return rows.map(rowToReceiptItem);
}

/**
 * Update a receipt item
 *
 * @param id - Item ID
 * @param updates - Partial item data to update
 * @returns Promise<void>
 */
export async function updateReceiptItem(
  id: string,
  updates: Partial<Omit<ReceiptItem, 'id'>>
): Promise<void> {
  const db = await getDatabase();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.price !== undefined) {
    fields.push('price = ?');
    values.push(updates.price);
  }
  if (updates.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(updates.quantity);
  }

  values.push(id);

  if (fields.length > 0) {
    const query = `UPDATE receipt_items SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }
}

/**
 * Delete a receipt item
 *
 * @param id - Item ID
 * @returns Promise<void>
 */
export async function deleteReceiptItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM receipt_items WHERE id = ?', [id]);
}

/**
 * Get total amount for receipts by category
 *
 * @param categoryId - Category ID
 * @returns Promise<number> - Total amount
 */
export async function getTotalByCategoryId(categoryId: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM receipts WHERE category_id = ?',
    [categoryId]
  );

  return result?.total ?? 0;
}
