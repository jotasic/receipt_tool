/**
 * Custom Field Service
 *
 * Provides CRUD operations for custom fields and their values
 */

import { getDatabase } from './getDatabase';
import type { CustomFieldRow, ItemCustomValueRow } from './types';
import type {
  CustomField,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
  CustomFieldValue,
} from '@/types';

/**
 * Convert database row to CustomField type
 */
function rowToCustomField(row: CustomFieldRow): CustomField {
  return {
    id: row.id,
    name: row.name,
    fieldType: row.field_type,
    options: row.options ? JSON.parse(row.options) : undefined,
    isRequired: row.is_required === 1,
    entityType: 'item',
    displayOrder: row.display_order,
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
// Custom Field CRUD Operations
// ============================================================================

/**
 * Create a new custom field
 *
 * @param input - Custom field data
 * @returns Promise<CustomField> - The created custom field
 */
export async function createCustomField(input: CreateCustomFieldInput): Promise<CustomField> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO custom_fields (id, name, field_type, options, is_required, entity_type, display_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.fieldType,
      input.options ? JSON.stringify(input.options) : null,
      input.isRequired ? 1 : 0,
      'item',
      input.displayOrder || 0,
      now,
    ]
  );

  return {
    id,
    name: input.name,
    fieldType: input.fieldType,
    options: input.options,
    isRequired: input.isRequired || false,
    entityType: 'item',
    displayOrder: input.displayOrder || 0,
    createdAt: now,
  };
}

/**
 * Get all custom fields
 *
 * @returns Promise<CustomField[]> - Array of all custom fields
 */
export async function getCustomFields(): Promise<CustomField[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CustomFieldRow>(
    'SELECT * FROM custom_fields ORDER BY display_order ASC, name ASC'
  );

  return rows.map(rowToCustomField);
}

/**
 * Get a custom field by ID
 *
 * @param id - Custom field ID
 * @returns Promise<CustomField | null> - Custom field or null if not found
 */
export async function getCustomFieldById(id: string): Promise<CustomField | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CustomFieldRow>(
    'SELECT * FROM custom_fields WHERE id = ?',
    [id]
  );

  return row ? rowToCustomField(row) : null;
}

/**
 * Update a custom field
 *
 * @param id - Custom field ID
 * @param updates - Partial custom field data to update
 * @returns Promise<void>
 */
export async function updateCustomField(
  id: string,
  updates: UpdateCustomFieldInput
): Promise<void> {
  const db = await getDatabase();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.fieldType !== undefined) {
    fields.push('field_type = ?');
    values.push(updates.fieldType);
  }
  if (updates.options !== undefined) {
    fields.push('options = ?');
    values.push(JSON.stringify(updates.options));
  }
  if (updates.isRequired !== undefined) {
    fields.push('is_required = ?');
    values.push(updates.isRequired ? 1 : 0);
  }
  if (updates.displayOrder !== undefined) {
    fields.push('display_order = ?');
    values.push(updates.displayOrder);
  }

  values.push(id);

  if (fields.length > 0) {
    const query = `UPDATE custom_fields SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }
}

/**
 * Delete a custom field
 *
 * @param id - Custom field ID
 * @returns Promise<void>
 */
export async function deleteCustomField(id: string): Promise<void> {
  const db = await getDatabase();
  // Cascade delete will remove values automatically
  await db.runAsync('DELETE FROM custom_fields WHERE id = ?', [id]);
}

// ============================================================================
// Item Custom Field Value Operations
// ============================================================================

/**
 * Set custom field value for an item
 */
export async function setItemCustomValue(
  itemId: string,
  fieldId: string,
  value: string | null
): Promise<void> {
  const db = await getDatabase();

  if (value === null || value === '') {
    await db.runAsync(
      'DELETE FROM item_custom_values WHERE item_id = ? AND field_id = ?',
      [itemId, fieldId]
    );
  } else {
    await db.runAsync(
      'INSERT OR REPLACE INTO item_custom_values (item_id, field_id, value) VALUES (?, ?, ?)',
      [itemId, fieldId, value]
    );
  }
}

/**
 * Get custom field values for an item
 */
export async function getItemCustomValues(itemId: string): Promise<CustomFieldValue[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ItemCustomValueRow>(
    `SELECT icv.field_id, icv.value, cf.name, cf.field_type
     FROM item_custom_values icv
     INNER JOIN custom_fields cf ON icv.field_id = cf.id
     WHERE icv.item_id = ?
     ORDER BY cf.display_order ASC`,
    [itemId]
  );

  return rows.map((row) => ({
    fieldId: row.field_id,
    value: row.value,
    fieldName: row.name,
    fieldType: row.field_type as 'text' | 'number' | 'date' | 'select' | undefined,
  }));
}

/**
 * Delete all custom values for an item
 */
export async function deleteItemCustomValues(itemId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM item_custom_values WHERE item_id = ?', [itemId]);
}

/**
 * Set multiple custom field values for an item
 */
export async function setItemCustomValues(
  itemId: string,
  values: Record<string, string | null>
): Promise<void> {
  for (const [fieldId, value] of Object.entries(values)) {
    await setItemCustomValue(itemId, fieldId, value);
  }
}

// ============================================================================
// Usage Check Operations
// ============================================================================

/**
 * Check if custom field is in use
 */
export async function isCustomFieldInUse(fieldId: string): Promise<boolean> {
  const db = await getDatabase();

  const itemCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM item_custom_values WHERE field_id = ?',
    [fieldId]
  );

  return (itemCount?.count || 0) > 0;
}

/**
 * Get usage count for a custom field
 */
export async function getCustomFieldUsageCount(fieldId: string): Promise<number> {
  const db = await getDatabase();

  const itemCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM item_custom_values WHERE field_id = ?',
    [fieldId]
  );

  return itemCount?.count || 0;
}
