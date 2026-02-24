/**
 * Usage Purpose Service
 *
 * Provides CRUD operations for managing usage purposes (categories for items).
 * Usage purposes are user-configurable and used throughout the app for
 * categorizing receipts, proof documents, and other items.
 */

import { getDatabase } from './getDatabase';
import { generateUniqueId } from './utils';
import type { UsagePurposeRow } from './types';
import type {
  UsagePurpose,
  CreateUsagePurposeInput,
  UpdateUsagePurposeInput,
} from '@/types/usagePurpose';
import { isDefaultUsagePurpose } from '@/types/usagePurpose';

/**
 * Convert database row to UsagePurpose type
 */
function rowToUsagePurpose(row: UsagePurposeRow): UsagePurpose {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en,
    icon: row.icon,
    color: row.color,
    isActive: row.is_active === 1,
    displayOrder: row.display_order,
  };
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all usage purposes
 *
 * Returns all usage purposes ordered by display_order ascending.
 *
 * @returns Promise<UsagePurpose[]> - Array of all usage purposes
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getAllUsagePurposes(): Promise<UsagePurpose[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<UsagePurposeRow>(
      'SELECT * FROM usage_purposes ORDER BY display_order ASC, name ASC'
    );

    return rows.map(rowToUsagePurpose);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get all usage purposes: ${errorMessage}`);
  }
}

/**
 * Get active usage purposes only
 *
 * Returns only usage purposes where is_active = 1, ordered by display_order.
 * This is the main method for populating UI dropdowns and selection lists.
 *
 * @param spaceId - Optional space ID to filter by; omit for all active purposes
 * @returns Promise<UsagePurpose[]> - Array of active usage purposes
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getActiveUsagePurposes(spaceId?: string): Promise<UsagePurpose[]> {
  try {
    const db = await getDatabase();
    const rows = spaceId
      ? await db.getAllAsync<UsagePurposeRow>(
          'SELECT * FROM usage_purposes WHERE is_active = 1 AND space_id = ? ORDER BY display_order ASC, name ASC',
          [spaceId]
        )
      : await db.getAllAsync<UsagePurposeRow>(
          'SELECT * FROM usage_purposes WHERE is_active = 1 ORDER BY display_order ASC, name ASC'
        );

    return rows.map(rowToUsagePurpose);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get active usage purposes: ${errorMessage}`);
  }
}

/**
 * Get a usage purpose by ID
 *
 * @param id - Usage purpose ID
 * @returns Promise<UsagePurpose | null> - Usage purpose object or null if not found
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getUsagePurposeById(id: string): Promise<UsagePurpose | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<UsagePurposeRow>(
      'SELECT * FROM usage_purposes WHERE id = ?',
      [id]
    );

    return row ? rowToUsagePurpose(row) : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get usage purpose by ID: ${errorMessage}`);
  }
}

// ============================================================================
// Create Operation
// ============================================================================

/**
 * Create a new usage purpose
 *
 * Auto-generates ID if not provided, and auto-assigns display_order if not provided.
 * Sets is_active to 1 by default.
 *
 * @param input - Usage purpose data
 * @returns Promise<UsagePurpose> - The created usage purpose
 * @throws Error with [Database] prefix if database operation fails
 * @throws Error if name is empty or already exists
 *
 * @example
 * const purpose = await createUsagePurpose({
 *   name: '교통비',
 *   nameEn: 'Transportation',
 *   icon: 'car',
 *   color: '#4ECDC4',
 * });
 */
export async function createUsagePurpose(
  input: CreateUsagePurposeInput
): Promise<UsagePurpose> {
  try {
    const db = await getDatabase();

    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('사용처 이름을 입력해주세요');
    }

    // Check for duplicate name within the same space
    const existing = input.spaceId
      ? await db.getFirstAsync<UsagePurposeRow>(
          'SELECT * FROM usage_purposes WHERE name = ? AND space_id = ?',
          [input.name.trim(), input.spaceId]
        )
      : await db.getFirstAsync<UsagePurposeRow>(
          'SELECT * FROM usage_purposes WHERE name = ? AND space_id IS NULL',
          [input.name.trim()]
        );

    if (existing) {
      throw new Error(`'${input.name}' 사용처가 이미 존재합니다`);
    }

    // Generate ID if not provided
    const id = input.id || generateUniqueId();

    // Auto-assign display_order if not provided
    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const maxOrderRow = await db.getFirstAsync<{ max_order: number | null }>(
        'SELECT MAX(display_order) as max_order FROM usage_purposes'
      );
      displayOrder = (maxOrderRow?.max_order ?? 0) + 1;
    }

    // Insert the new usage purpose
    await db.runAsync(
      `INSERT INTO usage_purposes (id, name, name_en, icon, color, is_active, display_order, space_id)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        input.name.trim(),
        input.nameEn?.trim() ?? null,
        input.icon ?? null,
        input.color ?? null,
        displayOrder,
        input.spaceId ?? null,
      ]
    );

    return {
      id,
      name: input.name.trim(),
      nameEn: input.nameEn?.trim() ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      isActive: true,
      displayOrder,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to create usage purpose: ${errorMessage}`);
  }
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update a usage purpose
 *
 * Allows partial updates of any field. Only provided fields are updated.
 *
 * @param id - Usage purpose ID
 * @param updates - Partial usage purpose data to update
 * @returns Promise<UsagePurpose> - The updated usage purpose
 * @throws Error with [Database] prefix if database operation fails
 * @throws Error if usage purpose not found or name conflicts
 *
 * @example
 * const updated = await updateUsagePurpose('meal', {
 *   name: '식비',
 *   color: '#FF6B6B',
 * });
 */
export async function updateUsagePurpose(
  id: string,
  updates: UpdateUsagePurposeInput
): Promise<UsagePurpose> {
  try {
    const db = await getDatabase();

    // Check if usage purpose exists
    const existing = await db.getFirstAsync<UsagePurposeRow>(
      'SELECT * FROM usage_purposes WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new Error(`ID "${id}"에 해당하는 사용처를 찾을 수 없습니다`);
    }

    // If updating name, check for duplicates within the same space (excluding current record)
    if (updates.name && updates.name.trim().length > 0) {
      const duplicate = existing.space_id
        ? await db.getFirstAsync<UsagePurposeRow>(
            'SELECT * FROM usage_purposes WHERE name = ? AND space_id = ? AND id != ?',
            [updates.name.trim(), existing.space_id, id]
          )
        : await db.getFirstAsync<UsagePurposeRow>(
            'SELECT * FROM usage_purposes WHERE name = ? AND space_id IS NULL AND id != ?',
            [updates.name.trim(), id]
          );

      if (duplicate) {
        throw new Error(`'${updates.name}' 사용처가 이미 존재합니다`);
      }
    }

    // Build dynamic UPDATE query
    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    if (updates.name !== undefined && updates.name.trim().length > 0) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.nameEn !== undefined) {
      fields.push('name_en = ?');
      values.push(updates.nameEn?.trim() ?? null);
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
    if (updates.displayOrder !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.displayOrder);
    }

    // Add id for WHERE clause
    values.push(id);

    if (fields.length > 0) {
      const query = `UPDATE usage_purposes SET ${fields.join(', ')} WHERE id = ?`;
      await db.runAsync(query, values);
    }

    // Fetch and return the updated record
    const updated = await db.getFirstAsync<UsagePurposeRow>(
      'SELECT * FROM usage_purposes WHERE id = ?',
      [id]
    );

    if (!updated) {
      throw new Error('수정된 사용처를 불러오는 데 실패했습니다');
    }

    return rowToUsagePurpose(updated);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to update usage purpose: ${errorMessage}`);
  }
}

/**
 * Toggle the active status of a usage purpose
 *
 * Convenience method to flip is_active between 0 and 1.
 *
 * @param id - Usage purpose ID
 * @returns Promise<UsagePurpose> - The updated usage purpose
 * @throws Error with [Database] prefix if database operation fails
 *
 * @example
 * const toggled = await toggleUsagePurposeActive('meal');
 */
export async function toggleUsagePurposeActive(id: string): Promise<UsagePurpose> {
  try {
    const db = await getDatabase();

    // Get current status
    const current = await db.getFirstAsync<UsagePurposeRow>(
      'SELECT * FROM usage_purposes WHERE id = ?',
      [id]
    );

    if (!current) {
      throw new Error(`ID "${id}"에 해당하는 사용처를 찾을 수 없습니다`);
    }

    // Toggle the status
    const newStatus = current.is_active === 1 ? 0 : 1;

    await db.runAsync('UPDATE usage_purposes SET is_active = ? WHERE id = ?', [newStatus, id]);

    // Fetch and return updated record
    const updated = await db.getFirstAsync<UsagePurposeRow>(
      'SELECT * FROM usage_purposes WHERE id = ?',
      [id]
    );

    if (!updated) {
      throw new Error('수정된 사용처를 불러오는 데 실패했습니다');
    }

    return rowToUsagePurpose(updated);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to toggle usage purpose active status: ${errorMessage}`);
  }
}

/**
 * Reorder usage purposes
 *
 * Updates the display_order of multiple usage purposes at once.
 * The array index determines the new display_order (starting from 1).
 *
 * @param orderedIds - Array of usage purpose IDs in desired order
 * @returns Promise<void>
 * @throws Error with [Database] prefix if database operation fails
 *
 * @example
 * await reorderUsagePurposes(['meal', 'transportation', 'medical', 'other']);
 */
export async function reorderUsagePurposes(orderedIds: string[]): Promise<void> {
  try {
    const db = await getDatabase();

    // Update each usage purpose with its new display_order
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const displayOrder = i + 1;

      await db.runAsync('UPDATE usage_purposes SET display_order = ? WHERE id = ?', [
        displayOrder,
        id,
      ]);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to reorder usage purposes: ${errorMessage}`);
  }
}

// ============================================================================
// Delete Operation
// ============================================================================

/**
 * Delete a usage purpose
 *
 * Validates that:
 * 1. The usage purpose is not a default/system purpose (meal, other)
 * 2. The usage purpose is not in use by any items
 *
 * @param id - Usage purpose ID
 * @returns Promise<void>
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * await deleteUsagePurpose('custom-purpose-id');
 */
export async function deleteUsagePurpose(id: string): Promise<void> {
  try {
    const db = await getDatabase();

    // Prevent deleting default usage purposes
    if (isDefaultUsagePurpose(id)) {
      throw new Error(
        `기본 사용처 "${id}"는 삭제할 수 없습니다. 비활성화만 가능합니다.`
      );
    }

    // Check if usage purpose is in use
    const inUse = await isUsagePurposeInUse(id);
    if (inUse) {
      throw new Error(
        '항목에서 사용 중인 사용처는 삭제할 수 없습니다. 해당 항목을 먼저 수정하거나 삭제해주세요.'
      );
    }

    // Delete the usage purpose
    await db.runAsync('DELETE FROM usage_purposes WHERE id = ?', [id]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to delete usage purpose: ${errorMessage}`);
  }
}

// ============================================================================
// Utility Operations
// ============================================================================

/**
 * Check if a usage purpose is in use by any items
 *
 * Queries the items table to see if any records reference this usage purpose.
 *
 * @param id - Usage purpose ID
 * @returns Promise<boolean> - true if in use, false otherwise
 * @throws Error with [Database] prefix if database operation fails
 *
 * @example
 * const inUse = await isUsagePurposeInUse('meal');
 * if (inUse) {
 *   console.log('This purpose is being used by items');
 * }
 */
export async function isUsagePurposeInUse(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items WHERE usage_purpose = ?',
      [id]
    );

    return (result?.count ?? 0) > 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to check if usage purpose is in use: ${errorMessage}`);
  }
}

/**
 * Get usage count for a specific usage purpose
 *
 * Returns the number of items using this usage purpose.
 *
 * @param id - Usage purpose ID
 * @returns Promise<number> - Number of items using this purpose
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getUsagePurposeUsageCount(id: string): Promise<number> {
  try {
    const db = await getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items WHERE usage_purpose = ?',
      [id]
    );

    return result?.count ?? 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(
      `[Database] Failed to get usage purpose usage count: ${errorMessage}`
    );
  }
}

/**
 * Get usage statistics for all usage purposes
 *
 * Returns an array of usage purposes with their usage counts.
 *
 * @param spaceId - Optional space ID to filter by; omit for all spaces
 * @returns Promise<Array<UsagePurpose & { usageCount: number }>>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getUsagePurposeStatistics(
  spaceId?: string
): Promise<Array<UsagePurpose & { usageCount: number }>> {
  try {
    const db = await getDatabase();

    const rows = spaceId
      ? await db.getAllAsync<UsagePurposeRow & { usage_count: number }>(
          `SELECT up.*, COUNT(i.id) as usage_count
           FROM usage_purposes up
           LEFT JOIN items i ON up.id = i.usage_purpose
           WHERE up.space_id = ?
           GROUP BY up.id
           ORDER BY up.display_order ASC, up.name ASC`,
          [spaceId]
        )
      : await db.getAllAsync<UsagePurposeRow & { usage_count: number }>(
          `SELECT up.*, COUNT(i.id) as usage_count
           FROM usage_purposes up
           LEFT JOIN items i ON up.id = i.usage_purpose
           GROUP BY up.id
           ORDER BY up.display_order ASC, up.name ASC`
        );

    return rows.map((row) => ({
      ...rowToUsagePurpose(row),
      usageCount: row.usage_count,
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(
      `[Database] Failed to get usage purpose statistics: ${errorMessage}`
    );
  }
}
