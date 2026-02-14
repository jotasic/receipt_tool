/**
 * Document Type Migration
 *
 * Migrates deprecated document types (contract, estimate, invoice) to 'other'
 * This migration is idempotent and safe to run multiple times
 */

import * as SQLite from 'expo-sqlite';

/**
 * Migrate deprecated document types to 'other'
 *
 * Converts any documents with removed document types:
 * - contract (계약서) → other
 * - estimate (견적서) → other
 * - invoice (청구서) → other
 *
 * This function is idempotent and safe to re-run.
 *
 * @param db - The SQLite database instance
 * @returns Promise<void>
 */
export async function migrateDocumentTypes(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  try {
    console.log('[Migration] Starting document type migration...');

    // Check if documents table exists
    const tableExists = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master
       WHERE type='table' AND name='documents'`
    );

    if (!tableExists || tableExists.count === 0) {
      console.log('[Migration] Documents table does not exist, skipping migration');
      return;
    }

    // Count documents with deprecated types
    const deprecatedTypesCount = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM documents
       WHERE document_type IN ('contract', 'estimate', 'invoice')`
    );

    const count = deprecatedTypesCount?.count || 0;

    if (count === 0) {
      console.log('[Migration] No documents with deprecated types found');
      return;
    }

    console.log(
      `[Migration] Found ${count} document(s) with deprecated types to migrate`
    );

    // Perform the migration within a transaction
    await db.execAsync('BEGIN TRANSACTION');

    try {
      // Update deprecated document types to 'other'
      const result = await db.runAsync(
        `UPDATE documents
         SET document_type = 'other',
             updated_at = datetime('now')
         WHERE document_type IN ('contract', 'estimate', 'invoice')`
      );

      await db.execAsync('COMMIT');

      console.log(
        `[Migration] Successfully migrated ${result.changes} document(s) to 'other' type`
      );
      console.log('[Migration] Document type migration completed successfully');
    } catch (updateError) {
      await db.execAsync('ROLLBACK');
      throw updateError;
    }
  } catch (error) {
    console.error('[Migration] Document type migration failed:', error);
    console.error('[Migration] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    throw new Error(
      `Document type migration failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Verify migration completion
 *
 * Checks that no documents remain with deprecated types
 *
 * @param db - The SQLite database instance
 * @returns Promise<boolean> - True if no deprecated types exist
 */
export async function verifyDocumentTypeMigration(
  db: SQLite.SQLiteDatabase
): Promise<boolean> {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM documents
       WHERE document_type IN ('contract', 'estimate', 'invoice')`
    );

    const count = result?.count || 0;
    const isValid = count === 0;

    if (isValid) {
      console.log('[Migration] Verification passed: No deprecated document types found');
    } else {
      console.warn(
        `[Migration] Verification failed: ${count} document(s) still have deprecated types`
      );
    }

    return isValid;
  } catch (error) {
    console.error('[Migration] Verification failed:', error);
    return false;
  }
}
