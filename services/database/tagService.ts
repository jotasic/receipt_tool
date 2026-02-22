/**
 * Tag Service
 *
 * Provides CRUD operations for tags and tag associations
 */

import { getDatabase } from './getDatabase';
import type { TagRow, ReceiptTagRow, DocumentTagRow } from './types';
import type { Tag, CreateTagInput, UpdateTagInput } from '@/types';

/**
 * Convert database row to Tag type
 */
function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ============================================================================
// Tag CRUD Operations
// ============================================================================

/**
 * Create a new tag
 *
 * @param input - Tag data
 * @returns Promise<Tag> - The created tag
 */
export async function createTag(input: CreateTagInput): Promise<Tag> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO tags (id, name, color, space_id, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, input.name, input.color || '#6B7280', input.spaceId ?? null, now]
  );

  return {
    id,
    name: input.name,
    color: input.color || '#6B7280',
    createdAt: now,
  };
}

/**
 * Get all tags, optionally filtered by space
 *
 * @param spaceId - Optional space ID to filter by; omit for all tags
 * @returns Promise<Tag[]> - Array of tags ordered by name ascending
 */
export async function getTags(spaceId?: string): Promise<Tag[]> {
  const db = await getDatabase();
  const rows = spaceId
    ? await db.getAllAsync<TagRow>(
        'SELECT * FROM tags WHERE space_id = ? ORDER BY name ASC',
        [spaceId]
      )
    : await db.getAllAsync<TagRow>('SELECT * FROM tags ORDER BY name ASC');

  return rows.map(rowToTag);
}

/**
 * Get a tag by ID
 *
 * @param id - Tag ID
 * @returns Promise<Tag | null> - Tag object or null if not found
 */
export async function getTagById(id: string): Promise<Tag | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TagRow>(
    'SELECT * FROM tags WHERE id = ?',
    [id]
  );

  return row ? rowToTag(row) : null;
}

/**
 * Get a tag by name
 *
 * @param name - Tag name
 * @returns Promise<Tag | null> - Tag object or null if not found
 */
export async function getTagByName(name: string): Promise<Tag | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TagRow>(
    'SELECT * FROM tags WHERE name = ?',
    [name]
  );

  return row ? rowToTag(row) : null;
}

/**
 * Update a tag
 *
 * @param id - Tag ID
 * @param updates - Partial tag data to update
 * @returns Promise<void>
 */
export async function updateTag(id: string, updates: UpdateTagInput): Promise<void> {
  const db = await getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }

  values.push(id);

  if (fields.length > 0) {
    const query = `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }
}

/**
 * Delete a tag
 *
 * @param id - Tag ID
 * @returns Promise<void>
 */
export async function deleteTag(id: string): Promise<void> {
  const db = await getDatabase();
  // Cascade delete will remove associations automatically
  await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
}

/**
 * Search tags by name
 *
 * @param query - Search query
 * @returns Promise<Tag[]> - Array of matching tags
 */
export async function searchTags(query: string): Promise<Tag[]> {
  const db = await getDatabase();
  const searchPattern = `%${query}%`;
  const rows = await db.getAllAsync<TagRow>(
    'SELECT * FROM tags WHERE name LIKE ? ORDER BY name ASC',
    [searchPattern]
  );

  return rows.map(rowToTag);
}

// ============================================================================
// Receipt-Tag Association Operations
// ============================================================================

/**
 * Add a tag to a receipt
 *
 * @param receiptId - Receipt ID
 * @param tagId - Tag ID
 * @returns Promise<void>
 */
export async function addTagToReceipt(receiptId: string, tagId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO receipt_tags (receipt_id, tag_id) VALUES (?, ?)',
    [receiptId, tagId]
  );
}

/**
 * Remove a tag from a receipt
 *
 * @param receiptId - Receipt ID
 * @param tagId - Tag ID
 * @returns Promise<void>
 */
export async function removeTagFromReceipt(receiptId: string, tagId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM receipt_tags WHERE receipt_id = ? AND tag_id = ?',
    [receiptId, tagId]
  );
}

/**
 * Get all tags for a receipt
 *
 * @param receiptId - Receipt ID
 * @returns Promise<Tag[]> - Array of tags
 */
export async function getTagsForReceipt(receiptId: string): Promise<Tag[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TagRow>(
    `SELECT t.* FROM tags t
     INNER JOIN receipt_tags rt ON t.id = rt.tag_id
     WHERE rt.receipt_id = ?
     ORDER BY t.name ASC`,
    [receiptId]
  );

  return rows.map(rowToTag);
}

/**
 * Get all receipts with a specific tag
 *
 * @param tagId - Tag ID
 * @returns Promise<string[]> - Array of receipt IDs
 */
export async function getReceiptsByTag(tagId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ receipt_id: string }>(
    'SELECT receipt_id FROM receipt_tags WHERE tag_id = ?',
    [tagId]
  );

  return rows.map((row) => row.receipt_id);
}

/**
 * Set tags for a receipt (replaces existing tags)
 *
 * @param receiptId - Receipt ID
 * @param tagIds - Array of tag IDs
 * @returns Promise<void>
 */
export async function setTagsForReceipt(receiptId: string, tagIds: string[]): Promise<void> {
  const db = await getDatabase();

  // Remove all existing tags
  await db.runAsync('DELETE FROM receipt_tags WHERE receipt_id = ?', [receiptId]);

  // Add new tags
  for (const tagId of tagIds) {
    await db.runAsync(
      'INSERT INTO receipt_tags (receipt_id, tag_id) VALUES (?, ?)',
      [receiptId, tagId]
    );
  }
}

// ============================================================================
// Document-Tag Association Operations
// ============================================================================

/**
 * Add a tag to a document
 *
 * @param documentId - Document ID
 * @param tagId - Tag ID
 * @returns Promise<void>
 */
export async function addTagToDocument(documentId: string, tagId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO document_tags (document_id, tag_id) VALUES (?, ?)',
    [documentId, tagId]
  );
}

/**
 * Remove a tag from a document
 *
 * @param documentId - Document ID
 * @param tagId - Tag ID
 * @returns Promise<void>
 */
export async function removeTagFromDocument(documentId: string, tagId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM document_tags WHERE document_id = ? AND tag_id = ?',
    [documentId, tagId]
  );
}

/**
 * Get all tags for a document
 *
 * @param documentId - Document ID
 * @returns Promise<Tag[]> - Array of tags
 */
export async function getTagsForDocument(documentId: string): Promise<Tag[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TagRow>(
    `SELECT t.* FROM tags t
     INNER JOIN document_tags dt ON t.id = dt.tag_id
     WHERE dt.document_id = ?
     ORDER BY t.name ASC`,
    [documentId]
  );

  return rows.map(rowToTag);
}

/**
 * Get all documents with a specific tag
 *
 * @param tagId - Tag ID
 * @returns Promise<string[]> - Array of document IDs
 */
export async function getDocumentsByTag(tagId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ document_id: string }>(
    'SELECT document_id FROM document_tags WHERE tag_id = ?',
    [tagId]
  );

  return rows.map((row) => row.document_id);
}

/**
 * Set tags for a document (replaces existing tags)
 *
 * @param documentId - Document ID
 * @param tagIds - Array of tag IDs
 * @returns Promise<void>
 */
export async function setTagsForDocument(documentId: string, tagIds: string[]): Promise<void> {
  const db = await getDatabase();

  // Remove all existing tags
  await db.runAsync('DELETE FROM document_tags WHERE document_id = ?', [documentId]);

  // Add new tags
  for (const tagId of tagIds) {
    await db.runAsync(
      'INSERT INTO document_tags (document_id, tag_id) VALUES (?, ?)',
      [documentId, tagId]
    );
  }
}

// ============================================================================
// Item-Tag Association Operations
// ============================================================================

/**
 * Add a tag to an item
 */
export async function addTagToItem(itemId: string, tagId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
    [itemId, tagId]
  );
}

/**
 * Remove a tag from an item
 */
export async function removeTagFromItem(itemId: string, tagId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?',
    [itemId, tagId]
  );
}

/**
 * Get all tags for an item
 */
export async function getTagsForItem(itemId: string): Promise<Tag[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TagRow>(
    `SELECT t.* FROM tags t
     INNER JOIN item_tags it ON t.id = it.tag_id
     WHERE it.item_id = ?
     ORDER BY t.name ASC`,
    [itemId]
  );

  return rows.map(rowToTag);
}

/**
 * Get all items with a specific tag
 */
export async function getItemsByTag(tagId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ item_id: string }>(
    'SELECT item_id FROM item_tags WHERE tag_id = ?',
    [tagId]
  );

  return rows.map((row) => row.item_id);
}

/**
 * Set tags for an item (replaces existing tags)
 */
export async function setTagsForItem(itemId: string, tagIds: string[]): Promise<void> {
  const db = await getDatabase();

  // Remove all existing tags
  await db.runAsync('DELETE FROM item_tags WHERE item_id = ?', [itemId]);

  // Add new tags
  for (const tagId of tagIds) {
    await db.runAsync(
      'INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)',
      [itemId, tagId]
    );
  }
}
