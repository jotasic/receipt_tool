/**
 * Tag Service
 *
 * Provides CRUD operations for tags and tag associations
 */

import { getDatabase } from './getDatabase';
import type { TagRow } from './types';
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
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Tag | null> - Tag object or null if not found
 */
export async function getTagByName(name: string, spaceId?: string): Promise<Tag | null> {
  const db = await getDatabase();
  const row = spaceId
    ? await db.getFirstAsync<TagRow>(
        'SELECT * FROM tags WHERE name = ? AND space_id = ?',
        [name, spaceId]
      )
    : await db.getFirstAsync<TagRow>(
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
  const values: (string | number | null)[] = [];

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
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Tag[]> - Array of matching tags
 */
export async function searchTags(query: string, spaceId?: string): Promise<Tag[]> {
  const db = await getDatabase();
  const searchPattern = `%${query}%`;
  const rows = spaceId
    ? await db.getAllAsync<TagRow>(
        'SELECT * FROM tags WHERE name LIKE ? AND space_id = ? ORDER BY name ASC',
        [searchPattern, spaceId]
      )
    : await db.getAllAsync<TagRow>(
        'SELECT * FROM tags WHERE name LIKE ? ORDER BY name ASC',
        [searchPattern]
      );

  return rows.map(rowToTag);
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
 * Get all tags with item usage count (single aggregation query, no N+1)
 *
 * @param spaceId - Optional space ID to filter by
 * @returns Promise<Array<Tag & { itemCount: number }>>
 */
export async function getTagsWithItemCount(
  spaceId?: string
): Promise<(Tag & { itemCount: number })[]> {
  const db = await getDatabase();
  const rows = spaceId
    ? await db.getAllAsync<TagRow & { item_count: number }>(
        `SELECT t.*, COUNT(it.item_id) as item_count
         FROM tags t
         LEFT JOIN item_tags it ON t.id = it.tag_id
         WHERE t.space_id = ?
         GROUP BY t.id
         ORDER BY t.name ASC`,
        [spaceId]
      )
    : await db.getAllAsync<TagRow & { item_count: number }>(
        `SELECT t.*, COUNT(it.item_id) as item_count
         FROM tags t
         LEFT JOIN item_tags it ON t.id = it.tag_id
         GROUP BY t.id
         ORDER BY t.name ASC`
      );

  return rows.map((row) => ({
    ...rowToTag(row),
    itemCount: row.item_count,
  }));
}

/**
 * Set tags for an item (replaces existing tags)
 */
export async function setTagsForItem(itemId: string, tagIds: string[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    // Remove all existing tags
    await db.runAsync('DELETE FROM item_tags WHERE item_id = ?', [itemId]);

    // Add new tags
    for (const tagId of tagIds) {
      await db.runAsync(
        'INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)',
        [itemId, tagId]
      );
    }
  });
}
