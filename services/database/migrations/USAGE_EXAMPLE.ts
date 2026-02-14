/**
 * Document Type Migration - Usage Example
 *
 * This file demonstrates how to use the document type migration
 */

import * as SQLite from 'expo-sqlite';
import {
  migrateDocumentTypes,
  verifyDocumentTypeMigration,
} from './migrateDocumentTypes';

/**
 * Example 1: Basic migration usage
 */
async function basicMigrationExample() {
  const db = await SQLite.openDatabaseAsync('receipt_tool.db');

  // Run the migration
  await migrateDocumentTypes(db);

  // The migration will:
  // 1. Find all documents with types: 'contract', 'estimate', 'invoice'
  // 2. Update them to document_type = 'other'
  // 3. Update the updated_at timestamp
  // 4. Log the number of documents migrated

  // Console output example:
  // [Migration] Starting document type migration...
  // [Migration] Found 5 document(s) with deprecated types to migrate
  // [Migration] Successfully migrated 5 document(s) to 'other' type
  // [Migration] Document type migration completed successfully
}

/**
 * Example 2: Verify migration completed successfully
 */
async function verifyMigrationExample() {
  const db = await SQLite.openDatabaseAsync('receipt_tool.db');

  // Run migration
  await migrateDocumentTypes(db);

  // Verify it completed successfully
  const isValid = await verifyDocumentTypeMigration(db);

  if (isValid) {
    console.log('Migration completed successfully - no deprecated types remain');
  } else {
    console.warn('Migration verification failed - some deprecated types still exist');
  }
}

/**
 * Example 3: Check what will be migrated before running
 */
async function checkBeforeMigrationExample() {
  const db = await SQLite.openDatabaseAsync('receipt_tool.db');

  // Check how many documents will be affected
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM documents
     WHERE document_type IN ('contract', 'estimate', 'invoice')`
  );

  const count = result?.count || 0;

  if (count > 0) {
    console.log(`Migration will update ${count} document(s)`);

    // Show which types will be migrated
    const typeBreakdown = await db.getAllAsync<{
      document_type: string;
      count: number;
    }>(
      `SELECT document_type, COUNT(*) as count FROM documents
       WHERE document_type IN ('contract', 'estimate', 'invoice')
       GROUP BY document_type`
    );

    console.log('Breakdown by type:');
    typeBreakdown.forEach((row) => {
      console.log(`  ${row.document_type}: ${row.count}`);
    });

    // Run migration
    await migrateDocumentTypes(db);
  } else {
    console.log('No documents need migration');
  }
}

/**
 * Example 4: Manual migration with custom logic
 */
async function customMigrationExample() {
  const db = await SQLite.openDatabaseAsync('receipt_tool.db');

  // Get all documents that need migration
  const deprecatedDocs = await db.getAllAsync<{
    id: string;
    title: string;
    document_type: string;
  }>(
    `SELECT id, title, document_type FROM documents
     WHERE document_type IN ('contract', 'estimate', 'invoice')`
  );

  console.log(`Found ${deprecatedDocs.length} documents to migrate:`);

  // Log each document before migration
  deprecatedDocs.forEach((doc) => {
    console.log(
      `- Document "${doc.title}" (${doc.id}) type: ${doc.document_type} → other`
    );
  });

  // Run the migration
  await migrateDocumentTypes(db);

  console.log('Migration completed');
}

/**
 * Example 5: Idempotency demonstration
 */
async function idempotencyExample() {
  const db = await SQLite.openDatabaseAsync('receipt_tool.db');

  // First run - will migrate documents
  console.log('First migration run:');
  await migrateDocumentTypes(db);
  // Output: [Migration] Found 5 document(s) with deprecated types to migrate

  // Second run - safe to run again, no documents to migrate
  console.log('Second migration run (idempotent):');
  await migrateDocumentTypes(db);
  // Output: [Migration] No documents with deprecated types found

  // Third run - still safe
  console.log('Third migration run:');
  await migrateDocumentTypes(db);
  // Output: [Migration] No documents with deprecated types found
}

/**
 * Example 6: Error handling
 */
async function errorHandlingExample() {
  const db = await SQLite.openDatabaseAsync('receipt_tool.db');

  try {
    await migrateDocumentTypes(db);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    // The migration automatically rolls back on error
    // No partial changes will be committed
  }
}

/**
 * Example 7: Integration in database initialization
 */
async function initializationExample() {
  const db = await SQLite.openDatabaseAsync('receipt_tool.db');

  // 1. Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      document_type TEXT DEFAULT 'other',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // 2. Create indexes
  await db.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type)"
  );

  // 3. Run migrations AFTER schema is set up
  await migrateDocumentTypes(db);

  // 4. Now database is ready to use
  console.log('Database initialized and migrations applied');
}

// Export examples for documentation
export {
  basicMigrationExample,
  verifyMigrationExample,
  checkBeforeMigrationExample,
  customMigrationExample,
  idempotencyExample,
  errorHandlingExample,
  initializationExample,
};
