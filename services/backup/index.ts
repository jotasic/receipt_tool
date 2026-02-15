/**
 * Backup and Restore Service
 *
 * Provides functionality to backup and restore database data
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '@/services/database';
import type { BackupData, BackupStats } from '@/types/backup';

const BACKUP_DIR = FileSystem.documentDirectory + 'backups/';
const BACKUP_VERSION = '1.0';

/**
 * Export all database data to JSON
 * Returns stringified JSON with all tables
 */
export async function exportDatabaseToJSON(): Promise<string> {
  const db = await getDatabase();

  const data: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables: {
      items: await db.getAllAsync('SELECT * FROM items') || [],
      tags: await db.getAllAsync('SELECT * FROM tags') || [],
      item_tags: await db.getAllAsync('SELECT * FROM item_tags') || [],
      usage_purposes: await db.getAllAsync('SELECT * FROM usage_purposes') || [],
      custom_fields: await db.getAllAsync('SELECT * FROM custom_fields') || [],
      item_custom_values: await db.getAllAsync('SELECT * FROM item_custom_values') || [],
      reports: await db.getAllAsync('SELECT * FROM reports') || [],
      report_items: await db.getAllAsync('SELECT * FROM report_items') || [],
    },
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import database data from JSON
 * WARNING: This will CLEAR existing data
 */
export async function importDatabaseFromJSON(jsonString: string): Promise<void> {
  const db = await getDatabase();
  const data = JSON.parse(jsonString) as BackupData;

  // Validate version
  if (!data.version || !data.tables) {
    throw new Error('Invalid backup file format');
  }

  // Clear existing data (in reverse order of dependencies)
  await db.runAsync('DELETE FROM item_custom_values');
  await db.runAsync('DELETE FROM report_items');
  await db.runAsync('DELETE FROM item_tags');
  await db.runAsync('DELETE FROM items');
  await db.runAsync('DELETE FROM tags');
  await db.runAsync('DELETE FROM custom_fields');
  await db.runAsync('DELETE FROM reports');
  // Keep usage_purposes (don't delete defaults)

  // Import data in correct order (respecting foreign keys)

  // 1. Tags (no dependencies)
  for (const tag of data.tables.tags || []) {
    await db.runAsync(
      'INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
      [tag.id, tag.name, tag.color, tag.created_at]
    );
  }

  // 2. Usage purposes (no dependencies)
  for (const purpose of data.tables.usage_purposes || []) {
    await db.runAsync(
      'INSERT OR REPLACE INTO usage_purposes (id, name, name_en, icon, color, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        purpose.id,
        purpose.name,
        purpose.name_en,
        purpose.icon,
        purpose.color,
        purpose.is_active,
        purpose.display_order,
      ]
    );
  }

  // 3. Custom fields (no dependencies)
  for (const field of data.tables.custom_fields || []) {
    await db.runAsync(
      'INSERT INTO custom_fields (id, name, field_type, options, is_required, entity_type, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        field.id,
        field.name,
        field.field_type,
        field.options,
        field.is_required,
        field.entity_type,
        field.display_order,
        field.created_at,
      ]
    );
  }

  // 4. Items (depends on usage_purposes)
  for (const item of data.tables.items || []) {
    await db.runAsync(
      'INSERT INTO items (id, title, classification, usage_purpose, amount, date, store_name, file_path, file_type, ocr_text, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        item.id,
        item.title,
        item.classification,
        item.usage_purpose,
        item.amount,
        item.date,
        item.store_name,
        item.file_path,
        item.file_type,
        item.ocr_text,
        item.memo,
        item.created_at,
        item.updated_at,
      ]
    );
  }

  // 5. Item tags (depends on items and tags)
  for (const itemTag of data.tables.item_tags || []) {
    await db.runAsync(
      'INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)',
      [itemTag.item_id, itemTag.tag_id]
    );
  }

  // 6. Custom values (depends on items and custom_fields)
  for (const value of data.tables.item_custom_values || []) {
    await db.runAsync(
      'INSERT INTO item_custom_values (item_id, field_id, value) VALUES (?, ?, ?)',
      [value.item_id, value.field_id, value.value]
    );
  }

  // 7. Reports (no dependencies)
  for (const report of data.tables.reports || []) {
    await db.runAsync(
      'INSERT INTO reports (id, title, total_amount, status, submitted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        report.id,
        report.title,
        report.total_amount,
        report.status,
        report.submitted_at,
        report.created_at,
        report.updated_at,
      ]
    );
  }

  // 8. Report items (depends on reports and items)
  for (const reportItem of data.tables.report_items || []) {
    await db.runAsync(
      'INSERT INTO report_items (report_id, item_id) VALUES (?, ?)',
      [reportItem.report_id, reportItem.item_id]
    );
  }
}

/**
 * Create a backup file and share it
 * Returns the file URI
 */
export async function createBackup(): Promise<string> {
  // Ensure backup directory exists
  const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }

  // Export database to JSON
  const jsonData = await exportDatabaseToJSON();

  // Create backup file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const fileName = `receipt-tool-backup-${timestamp}.json`;
  const fileUri = BACKUP_DIR + fileName;

  await FileSystem.writeAsStringAsync(fileUri, jsonData);

  return fileUri;
}

/**
 * Share backup file using system share sheet
 */
export async function shareBackup(fileUri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Backup File',
    UTI: 'public.json',
  });
}

/**
 * Pick a backup file and restore from it
 */
export async function restoreFromBackup(): Promise<void> {
  // Pick file
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    throw new Error('File selection cancelled');
  }

  // Read file content
  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri);

  // Import to database
  await importDatabaseFromJSON(content);
}

/**
 * Get current database statistics
 */
export async function getBackupStats(): Promise<BackupStats> {
  const db = await getDatabase();

  const [
    itemsResult,
    tagsResult,
    reportsResult,
    customFieldsResult,
    usagePurposesResult,
  ] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM items'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM tags'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM reports'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM custom_fields'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM usage_purposes'),
  ]);

  return {
    items: itemsResult?.count || 0,
    tags: tagsResult?.count || 0,
    reports: reportsResult?.count || 0,
    customFields: customFieldsResult?.count || 0,
    usagePurposes: usagePurposesResult?.count || 0,
  };
}
