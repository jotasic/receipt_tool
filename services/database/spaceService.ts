/**
 * Space Service
 *
 * Provides CRUD operations for managing spaces.
 * Spaces are top-level groupings (e.g. 회사, 개인) that contain
 * classifications, usage purposes, tags, and custom fields.
 */

import { getDatabase } from './getDatabase';
import { generateUniqueId } from './utils';
import type { SpaceRow } from './types';
import type {
  Space,
  CreateSpaceInput,
  UpdateSpaceInput,
} from '@/types/space';

// ============================================================================
// Row Converter
// ============================================================================

function rowToSpace(row: SpaceRow): Space {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all spaces ordered by display_order ascending
 *
 * @returns Promise<Space[]>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getAllSpaces(): Promise<Space[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SpaceRow>(
      'SELECT * FROM spaces ORDER BY display_order ASC, name ASC'
    );
    return rows.map(rowToSpace);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get all spaces: ${errorMessage}`);
  }
}

/**
 * Get a space by ID
 *
 * @param id - Space ID
 * @returns Promise<Space | null>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getSpaceById(id: string): Promise<Space | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SpaceRow>(
      'SELECT * FROM spaces WHERE id = ?',
      [id]
    );
    return row ? rowToSpace(row) : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get space by ID: ${errorMessage}`);
  }
}

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new space
 *
 * Auto-assigns display_order as max + 1 if not provided.
 *
 * @param input - Space data
 * @returns Promise<Space> - The created space
 * @throws Error if name is empty or already exists
 *
 * @example
 * const space = await createSpace({ name: '프리랜서', icon: '🖥️', color: '#8B5CF6' });
 */
export async function createSpace(input: CreateSpaceInput): Promise<Space> {
  try {
    const db = await getDatabase();

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Space name is required');
    }

    // Check for duplicate name
    const existing = await db.getFirstAsync<SpaceRow>(
      'SELECT * FROM spaces WHERE name = ?',
      [input.name.trim()]
    );
    if (existing) {
      throw new Error(`Space with name "${input.name}" already exists`);
    }

    const id = generateUniqueId();

    const maxOrderRow = await db.getFirstAsync<{ max_order: number | null }>(
      'SELECT MAX(display_order) as max_order FROM spaces'
    );
    const displayOrder = (maxOrderRow?.max_order ?? -1) + 1;

    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO spaces (id, name, icon, color, display_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name.trim(),
        input.icon ?? null,
        input.color ?? null,
        displayOrder,
        now,
      ]
    );

    return {
      id,
      name: input.name.trim(),
      icon: input.icon ?? undefined,
      color: input.color ?? undefined,
      displayOrder,
      createdAt: now,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to create space: ${errorMessage}`);
  }
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update a space
 *
 * Only provided fields are updated (partial update).
 *
 * @param id - Space ID
 * @param updates - Partial space data
 * @returns Promise<Space> - The updated space
 * @throws Error if space not found or name conflicts
 */
export async function updateSpace(id: string, updates: UpdateSpaceInput): Promise<Space> {
  try {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<SpaceRow>(
      'SELECT * FROM spaces WHERE id = ?',
      [id]
    );
    if (!existing) {
      throw new Error(`Space with ID "${id}" not found`);
    }

    if (updates.name !== undefined && updates.name.trim().length > 0) {
      const duplicate = await db.getFirstAsync<SpaceRow>(
        'SELECT * FROM spaces WHERE name = ? AND id != ?',
        [updates.name.trim(), id]
      );
      if (duplicate) {
        throw new Error(`Space with name "${updates.name}" already exists`);
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

    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE spaces SET ${fields.join(', ')} WHERE id = ?`,
        values as (string | number | null)[]
      );
    }

    const updated = await db.getFirstAsync<SpaceRow>(
      'SELECT * FROM spaces WHERE id = ?',
      [id]
    );
    if (!updated) {
      throw new Error('Failed to retrieve updated space');
    }
    return rowToSpace(updated);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to update space: ${errorMessage}`);
  }
}

/**
 * Reorder spaces
 *
 * Updates display_order for all spaces. Array index = new order (0-based).
 *
 * @param orderedIds - Array of space IDs in desired order
 * @returns Promise<void>
 */
export async function reorderSpaces(orderedIds: string[]): Promise<void> {
  try {
    const db = await getDatabase();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        'UPDATE spaces SET display_order = ? WHERE id = ?',
        [i, orderedIds[i]]
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to reorder spaces: ${errorMessage}`);
  }
}

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a space
 *
 * Validates that no items reference this space before deleting.
 * Classifications are CASCADE deleted by the FK constraint.
 *
 * @param id - Space ID
 * @returns Promise<void>
 * @throws Error if space is in use or not found
 */
export async function deleteSpace(id: string): Promise<void> {
  try {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<SpaceRow>(
      'SELECT * FROM spaces WHERE id = ?',
      [id]
    );
    if (!existing) {
      throw new Error(`Space with ID "${id}" not found`);
    }

    const inUse = await isSpaceInUse(id);
    if (inUse) {
      throw new Error(
        'Cannot delete space that has items. Please move or delete those items first.'
      );
    }

    await db.runAsync('DELETE FROM spaces WHERE id = ?', [id]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to delete space: ${errorMessage}`);
  }
}

// ============================================================================
// Utility Operations
// ============================================================================

/**
 * Check if a space is referenced by any items
 *
 * @param id - Space ID
 * @returns Promise<boolean> - true if any items reference this space
 * @throws Error with [Database] prefix if database operation fails
 */
export async function isSpaceInUse(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items WHERE space_id = ?',
      [id]
    );
    return (result?.count ?? 0) > 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to check if space is in use: ${errorMessage}`);
  }
}
