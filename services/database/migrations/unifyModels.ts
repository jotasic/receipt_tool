/**
 * Unified Model Migration
 *
 * Migrates receipts and documents into the unified items table
 * This migration consolidates two separate models into a single 2D classification system
 *
 * Migration Steps:
 * 1. Seed usage purposes
 * 2. Migrate receipts → items (with classification mapping)
 * 3. Migrate documents → items (as proof documents)
 * 4. Migrate report associations (report_receipts + report_documents → report_items)
 *
 * IMPORTANT: This migration is designed to be idempotent and safe
 * - Creates backup recommendation
 * - Transaction-based rollback on errors
 * - Data validation before insertion
 * - Detailed logging and error tracking
 */

import * as SQLite from 'expo-sqlite';
import { DEFAULT_USAGE_PURPOSES } from '../schema';

/**
 * Migration result interface
 */
export interface MigrationResult {
  success: boolean;
  receiptsCount: number;
  documentsCount: number;
  reportLinksCount: number;
  errors: string[];
  timestamp: string;
}

/**
 * Main migration function to unify receipts and documents into items table
 *
 * WARNING: This is a data migration that will copy data from receipts and documents
 * into the items table. It is recommended to backup your database before running.
 *
 * @param db - The SQLite database instance
 * @returns Promise<MigrationResult> - Migration statistics and error information
 */
export async function migrateToUnifiedModel(
  db: SQLite.SQLiteDatabase
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    receiptsCount: 0,
    documentsCount: 0,
    reportLinksCount: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    console.log('[UnifyMigration] Starting unified model migration...');
    console.log('[UnifyMigration] WARNING: It is recommended to backup your database before proceeding');

    // Check if migration has already been run
    const alreadyMigrated = await checkIfMigrationRun(db);
    if (alreadyMigrated) {
      console.log('[UnifyMigration] Migration has already been run, skipping');
      result.success = true;
      return result;
    }

    // Verify required tables exist
    await verifyRequiredTables(db);

    // Start transaction
    await db.execAsync('BEGIN TRANSACTION');

    try {
      // Step 1: Seed usage purposes
      console.log('[UnifyMigration] Step 1: Seeding usage purposes...');
      await seedUsagePurposes(db);

      // Step 2: Migrate receipts to items
      console.log('[UnifyMigration] Step 2: Migrating receipts to items...');
      result.receiptsCount = await migrateReceipts(db);
      console.log(`[UnifyMigration] Migrated ${result.receiptsCount} receipts`);

      // Step 3: Migrate documents to items
      console.log('[UnifyMigration] Step 3: Migrating documents to items...');
      result.documentsCount = await migrateDocuments(db);
      console.log(`[UnifyMigration] Migrated ${result.documentsCount} documents`);

      // Step 4: Migrate report associations
      console.log('[UnifyMigration] Step 4: Migrating report associations...');
      result.reportLinksCount = await migrateReportAssociations(db);
      console.log(`[UnifyMigration] Migrated ${result.reportLinksCount} report associations`);

      // Step 5: Validate migrated data
      console.log('[UnifyMigration] Step 5: Validating migrated data...');
      await validateMigration(db, result);

      // Commit transaction
      await db.execAsync('COMMIT');
      result.success = true;

      console.log('[UnifyMigration] Migration completed successfully');
      console.log('[UnifyMigration] Summary:', {
        receipts: result.receiptsCount,
        documents: result.documentsCount,
        reportLinks: result.reportLinksCount,
        timestamp: result.timestamp,
      });
    } catch (migrationError) {
      // Rollback on error
      await db.execAsync('ROLLBACK');
      throw migrationError;
    }
  } catch (error) {
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);

    console.error('[UnifyMigration] Migration failed:', error);
    console.error('[UnifyMigration] Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: result.timestamp,
    });

    throw new Error(`Unified model migration failed: ${errorMessage}`);
  }

  return result;
}

/**
 * Check if migration has already been run
 * Migration is considered complete if items table has data
 */
async function checkIfMigrationRun(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    // Check if items table exists
    const itemsTableExists = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master
       WHERE type='table' AND name='items'`
    );

    if (!itemsTableExists || itemsTableExists.count === 0) {
      console.log('[UnifyMigration] Items table does not exist yet');
      return false;
    }

    // Check if items table has data
    const itemsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items'
    );

    return (itemsCount?.count || 0) > 0;
  } catch (error) {
    console.error('[UnifyMigration] Error checking migration status:', error);
    return false;
  }
}

/**
 * Verify that required source tables exist
 */
async function verifyRequiredTables(db: SQLite.SQLiteDatabase): Promise<void> {
  const requiredTables = ['receipts', 'documents', 'items', 'usage_purposes', 'report_items'];

  for (const tableName of requiredTables) {
    const tableExists = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master
       WHERE type='table' AND name=?`,
      [tableName]
    );

    if (!tableExists || tableExists.count === 0) {
      throw new Error(`Required table '${tableName}' does not exist`);
    }
  }

  console.log('[UnifyMigration] All required tables verified');
}

/**
 * Seed usage purposes table with default values
 */
async function seedUsagePurposes(db: SQLite.SQLiteDatabase): Promise<void> {
  // Check if usage purposes already exist
  const existingCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM usage_purposes'
  );

  if (existingCount && existingCount.count > 0) {
    console.log('[UnifyMigration] Usage purposes already seeded, skipping');
    return;
  }

  // Insert default usage purposes
  for (const purpose of DEFAULT_USAGE_PURPOSES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO usage_purposes (id, name, name_en, icon, color, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [
        purpose.id,
        purpose.name,
        purpose.name_en,
        purpose.icon,
        purpose.color,
        purpose.display_order,
      ]
    );
  }

  console.log(`[UnifyMigration] Seeded ${DEFAULT_USAGE_PURPOSES.length} usage purposes`);
}

/**
 * Migrate receipts to items table
 * Maps receipt_type to classification and category_id to usage_purpose
 */
async function migrateReceipts(db: SQLite.SQLiteDatabase): Promise<number> {
  // Check if receipts table has data
  const receiptsCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM receipts'
  );

  const count = receiptsCount?.count || 0;
  if (count === 0) {
    console.log('[UnifyMigration] No receipts to migrate');
    return 0;
  }

  console.log(`[UnifyMigration] Found ${count} receipts to migrate`);

  // Migrate receipts to items
  const result = await db.runAsync(
    `INSERT INTO items (
      id,
      title,
      classification,
      usage_purpose,
      amount,
      date,
      store_name,
      file_path,
      file_type,
      ocr_text,
      memo,
      created_at,
      updated_at
    )
    SELECT
      id,
      title,
      CASE receipt_type
        WHEN 'personal' THEN 'personal_card'
        WHEN 'corporate' THEN 'corporate_card'
        ELSE 'corporate_card'
      END as classification,
      CASE category_id
        WHEN 'food' THEN 'meal'
        ELSE 'other'
      END as usage_purpose,
      amount,
      date,
      store_name,
      image_path as file_path,
      'image' as file_type,
      ocr_text,
      memo,
      created_at,
      updated_at
    FROM receipts`
  );

  return result.changes;
}

/**
 * Migrate documents to items table
 * All documents become 'proof_document' classification
 */
async function migrateDocuments(db: SQLite.SQLiteDatabase): Promise<number> {
  // Check if documents table has data
  const documentsCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM documents'
  );

  const count = documentsCount?.count || 0;
  if (count === 0) {
    console.log('[UnifyMigration] No documents to migrate');
    return 0;
  }

  console.log(`[UnifyMigration] Found ${count} documents to migrate`);

  // Check if document_type column exists
  const columnInfo = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(documents)`
  );
  const hasDocumentTypeColumn = columnInfo.some(col => col.name === 'document_type');

  // All documents become 'other' usage purpose
  const usagePurposeExpr = `'other'`;

  // Migrate documents to items
  const result = await db.runAsync(
    `INSERT INTO items (
      id,
      title,
      classification,
      usage_purpose,
      amount,
      date,
      file_path,
      file_type,
      ocr_text,
      memo,
      created_at,
      updated_at
    )
    SELECT
      id,
      title,
      'proof_document' as classification,
      ${usagePurposeExpr} as usage_purpose,
      NULL as amount,
      created_at as date,
      file_path,
      file_type,
      NULL as ocr_text,
      memo,
      created_at,
      updated_at
    FROM documents`
  );

  return result.changes;
}

/**
 * Migrate report associations from both report_receipts and report_documents
 * into the unified report_items table
 */
async function migrateReportAssociations(db: SQLite.SQLiteDatabase): Promise<number> {
  let totalMigrated = 0;

  // Migrate report_receipts
  const receiptLinksCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM report_receipts'
  );

  const receiptLinks = receiptLinksCount?.count || 0;
  if (receiptLinks > 0) {
    console.log(`[UnifyMigration] Migrating ${receiptLinks} receipt-report associations`);
    const receiptResult = await db.runAsync(
      `INSERT OR IGNORE INTO report_items (report_id, item_id)
       SELECT report_id, receipt_id FROM report_receipts`
    );
    totalMigrated += receiptResult.changes;
  }

  // Migrate report_documents
  const documentLinksCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM report_documents'
  );

  const documentLinks = documentLinksCount?.count || 0;
  if (documentLinks > 0) {
    console.log(`[UnifyMigration] Migrating ${documentLinks} document-report associations`);
    const documentResult = await db.runAsync(
      `INSERT OR IGNORE INTO report_items (report_id, item_id)
       SELECT report_id, document_id FROM report_documents`
    );
    totalMigrated += documentResult.changes;
  }

  return totalMigrated;
}

/**
 * Validate migration results
 */
async function validateMigration(
  db: SQLite.SQLiteDatabase,
  result: MigrationResult
): Promise<void> {
  // Validate item counts
  const itemsCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM items'
  );

  const totalExpected = result.receiptsCount + result.documentsCount;
  const totalActual = itemsCount?.count || 0;

  if (totalActual !== totalExpected) {
    throw new Error(
      `Item count mismatch: expected ${totalExpected}, got ${totalActual}`
    );
  }

  // Validate no NULL classifications or usage_purposes
  const invalidItems = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM items
     WHERE classification IS NULL OR usage_purpose IS NULL`
  );

  if (invalidItems && invalidItems.count > 0) {
    throw new Error(`Found ${invalidItems.count} items with NULL classification or usage_purpose`);
  }

  // Validate all items have valid dates
  const invalidDates = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM items WHERE date IS NULL`
  );

  if (invalidDates && invalidDates.count > 0) {
    throw new Error(`Found ${invalidDates.count} items with NULL dates`);
  }

  // Validate report_items count
  const reportItemsCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM report_items'
  );

  const reportItemsActual = reportItemsCount?.count || 0;
  if (reportItemsActual !== result.reportLinksCount) {
    throw new Error(
      `Report items count mismatch: expected ${result.reportLinksCount}, got ${reportItemsActual}`
    );
  }

  console.log('[UnifyMigration] Validation passed successfully');
}

/**
 * Verify migration completion
 *
 * Checks that migration was successful and data integrity is maintained
 *
 * @param db - The SQLite database instance
 * @returns Promise<boolean> - True if migration is complete and valid
 */
export async function verifyUnifiedModelMigration(
  db: SQLite.SQLiteDatabase
): Promise<boolean> {
  try {
    console.log('[UnifyMigration] Starting verification...');

    // Check items table exists and has data
    const itemsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items'
    );

    if (!itemsCount || itemsCount.count === 0) {
      console.warn('[UnifyMigration] Verification failed: No items found');
      return false;
    }

    // Check usage_purposes are seeded
    const purposesCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM usage_purposes'
    );

    if (!purposesCount || purposesCount.count === 0) {
      console.warn('[UnifyMigration] Verification failed: No usage purposes found');
      return false;
    }

    // Check for invalid classifications
    const invalidClassifications = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM items
       WHERE classification NOT IN ('personal_card', 'corporate_card', 'proof_document')`
    );

    if (invalidClassifications && invalidClassifications.count > 0) {
      console.warn(
        `[UnifyMigration] Verification failed: ${invalidClassifications.count} items with invalid classification`
      );
      return false;
    }

    // Check for invalid usage purposes
    const invalidPurposes = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM items
       WHERE usage_purpose NOT IN ('meal', 'other')`
    );

    if (invalidPurposes && invalidPurposes.count > 0) {
      console.warn(
        `[UnifyMigration] Verification failed: ${invalidPurposes.count} items with invalid usage_purpose`
      );
      return false;
    }

    // Check classification distribution
    const classificationStats = await db.getAllAsync<{
      classification: string;
      count: number;
    }>(
      `SELECT classification, COUNT(*) as count
       FROM items
       GROUP BY classification`
    );

    console.log('[UnifyMigration] Classification distribution:', classificationStats);

    // Check usage purpose distribution
    const purposeStats = await db.getAllAsync<{
      usage_purpose: string;
      count: number;
    }>(
      `SELECT usage_purpose, COUNT(*) as count
       FROM items
       GROUP BY usage_purpose`
    );

    console.log('[UnifyMigration] Usage purpose distribution:', purposeStats);

    console.log('[UnifyMigration] Verification passed successfully');
    console.log(`[UnifyMigration] Total items: ${itemsCount.count}`);
    console.log(`[UnifyMigration] Total usage purposes: ${purposesCount.count}`);

    return true;
  } catch (error) {
    console.error('[UnifyMigration] Verification failed:', error);
    return false;
  }
}

/**
 * Get migration statistics for reporting
 *
 * @param db - The SQLite database instance
 * @returns Promise<object> - Migration statistics
 */
export async function getMigrationStatistics(
  db: SQLite.SQLiteDatabase
): Promise<{
  itemsTotal: number;
  receiptSource: number;
  documentSource: number;
  classificationBreakdown: { classification: string; count: number }[];
  purposeBreakdown: { usage_purpose: string; count: number }[];
}> {
  try {
    // Total items
    const itemsTotal = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items'
    );

    // Original receipts count
    const receiptsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM receipts'
    );

    // Original documents count
    const documentsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM documents'
    );

    // Classification breakdown
    const classificationBreakdown = await db.getAllAsync<{
      classification: string;
      count: number;
    }>(
      `SELECT classification, COUNT(*) as count
       FROM items
       GROUP BY classification
       ORDER BY count DESC`
    );

    // Purpose breakdown
    const purposeBreakdown = await db.getAllAsync<{
      usage_purpose: string;
      count: number;
    }>(
      `SELECT usage_purpose, COUNT(*) as count
       FROM items
       GROUP BY usage_purpose
       ORDER BY count DESC`
    );

    return {
      itemsTotal: itemsTotal?.count || 0,
      receiptSource: receiptsCount?.count || 0,
      documentSource: documentsCount?.count || 0,
      classificationBreakdown,
      purposeBreakdown,
    };
  } catch (error) {
    console.error('[UnifyMigration] Failed to get statistics:', error);
    throw error;
  }
}
