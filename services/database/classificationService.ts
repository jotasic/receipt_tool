/**
 * Classification Service
 *
 * Provides CRUD operations for managing classifications within a space.
 * A classification is a sub-category of a space (e.g. 개인카드, 법인카드, 증빙서류).
 */

import { getDatabase } from './getDatabase';
import { generateUniqueId } from './utils';
import type { ClassificationRow } from './types';
import type {
  Classification,
  CreateClassificationInput,
  UpdateClassificationInput,
} from '@/types/space';

// ============================================================================
// Row Converter
// ============================================================================

function rowToClassification(row: ClassificationRow): Classification {
  return {
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
    isActive: row.is_active === 1,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all classifications for a space, ordered by display_order ascending
 *
 * @param spaceId - Parent space ID
 * @returns Promise<Classification[]>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getClassificationsBySpace(spaceId: string): Promise<Classification[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ClassificationRow>(
      'SELECT * FROM classifications WHERE space_id = ? ORDER BY display_order ASC, name ASC',
      [spaceId]
    );
    return rows.map(rowToClassification);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get classifications by space: ${errorMessage}`);
  }
}

/**
 * Get only active classifications for a space
 *
 * @param spaceId - Parent space ID
 * @returns Promise<Classification[]>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getActiveClassificationsBySpace(spaceId: string): Promise<Classification[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ClassificationRow>(
      `SELECT * FROM classifications
       WHERE space_id = ? AND is_active = 1
       ORDER BY display_order ASC, name ASC`,
      [spaceId]
    );
    return rows.map(rowToClassification);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get active classifications by space: ${errorMessage}`);
  }
}

/**
 * Get a classification by ID
 *
 * @param id - Classification ID
 * @returns Promise<Classification | null>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getClassificationById(id: string): Promise<Classification | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ClassificationRow>(
      'SELECT * FROM classifications WHERE id = ?',
      [id]
    );
    return row ? rowToClassification(row) : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get classification by ID: ${errorMessage}`);
  }
}

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new classification within a space
 *
 * Auto-assigns display_order as max + 1 within the space if not provided.
 *
 * @param input - Classification data
 * @returns Promise<Classification> - The created classification
 * @throws Error if name is empty or already exists within the space
 *
 * @example
 * const cls = await createClassification({
 *   spaceId: 'space-company-default',
 *   name: '기타',
 *   icon: '📌',
 *   color: '#6B7280',
 * });
 */
export async function createClassification(
  input: CreateClassificationInput
): Promise<Classification> {
  try {
    const db = await getDatabase();

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Classification name is required');
    }

    // Duplicate name check within same space
    const existing = await db.getFirstAsync<ClassificationRow>(
      'SELECT * FROM classifications WHERE space_id = ? AND name = ?',
      [input.spaceId, input.name.trim()]
    );
    if (existing) {
      throw new Error(
        `Classification with name "${input.name}" already exists in this space`
      );
    }

    const id = generateUniqueId();

    const maxOrderRow = await db.getFirstAsync<{ max_order: number | null }>(
      'SELECT MAX(display_order) as max_order FROM classifications WHERE space_id = ?',
      [input.spaceId]
    );
    const displayOrder = (maxOrderRow?.max_order ?? -1) + 1;

    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO classifications (id, space_id, name, icon, color, is_active, display_order, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        input.spaceId,
        input.name.trim(),
        input.icon ?? null,
        input.color ?? null,
        displayOrder,
        now,
      ]
    );

    return {
      id,
      spaceId: input.spaceId,
      name: input.name.trim(),
      icon: input.icon ?? undefined,
      color: input.color ?? undefined,
      isActive: true,
      displayOrder,
      createdAt: now,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to create classification: ${errorMessage}`);
  }
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update a classification
 *
 * Only provided fields are updated (partial update).
 *
 * @param id - Classification ID
 * @param updates - Partial classification data
 * @returns Promise<Classification> - The updated classification
 * @throws Error if classification not found or name conflicts
 */
export async function updateClassification(
  id: string,
  updates: UpdateClassificationInput
): Promise<Classification> {
  try {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<ClassificationRow>(
      'SELECT * FROM classifications WHERE id = ?',
      [id]
    );
    if (!existing) {
      throw new Error(`Classification with ID "${id}" not found`);
    }

    // Duplicate name check within same space (excluding current record)
    if (updates.name !== undefined && updates.name.trim().length > 0) {
      const duplicate = await db.getFirstAsync<ClassificationRow>(
        'SELECT * FROM classifications WHERE space_id = ? AND name = ? AND id != ?',
        [existing.space_id, updates.name.trim(), id]
      );
      if (duplicate) {
        throw new Error(
          `Classification with name "${updates.name}" already exists in this space`
        );
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined && updates.name.trim().length > 0) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon ?? null);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color ?? null);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE classifications SET ${fields.join(', ')} WHERE id = ?`,
        values as (string | number | null)[]
      );
    }

    const updated = await db.getFirstAsync<ClassificationRow>(
      'SELECT * FROM classifications WHERE id = ?',
      [id]
    );
    if (!updated) {
      throw new Error('Failed to retrieve updated classification');
    }
    return rowToClassification(updated);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to update classification: ${errorMessage}`);
  }
}

/**
 * Reorder classifications within a space
 *
 * Updates display_order for classifications in a space. Array index = new order (0-based).
 *
 * @param spaceId - Parent space ID (used for validation only)
 * @param orderedIds - Array of classification IDs in desired order
 * @returns Promise<void>
 */
export async function reorderClassifications(
  spaceId: string,
  orderedIds: string[]
): Promise<void> {
  try {
    const db = await getDatabase();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        'UPDATE classifications SET display_order = ? WHERE id = ? AND space_id = ?',
        [i, orderedIds[i], spaceId]
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to reorder classifications: ${errorMessage}`);
  }
}

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a classification
 *
 * Validates that no items reference this classification before deleting.
 *
 * @param id - Classification ID
 * @returns Promise<void>
 * @throws Error if classification is in use or not found
 */
export async function deleteClassification(id: string): Promise<void> {
  try {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<ClassificationRow>(
      'SELECT * FROM classifications WHERE id = ?',
      [id]
    );
    if (!existing) {
      throw new Error(`Classification with ID "${id}" not found`);
    }

    const inUse = await isClassificationInUse(id);
    if (inUse) {
      throw new Error(
        'Cannot delete classification that is in use by items. Please reassign or delete those items first.'
      );
    }

    await db.runAsync('DELETE FROM classifications WHERE id = ?', [id]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to delete classification: ${errorMessage}`);
  }
}

// ============================================================================
// Utility Operations
// ============================================================================

/**
 * Check if a classification is referenced by any items
 *
 * @param id - Classification ID
 * @returns Promise<boolean> - true if any items reference this classification
 * @throws Error with [Database] prefix if database operation fails
 */
export async function isClassificationInUse(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items WHERE classification_id = ?',
      [id]
    );
    return (result?.count ?? 0) > 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to check if classification is in use: ${errorMessage}`);
  }
}
