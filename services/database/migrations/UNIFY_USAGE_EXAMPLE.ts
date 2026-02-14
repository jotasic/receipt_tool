/**
 * Unified Model Migration - Usage Examples
 *
 * Demonstrates how to use the unified model migration in various scenarios
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import {
  migrateToUnifiedModel,
  verifyUnifiedModelMigration,
  getMigrationStatistics,
  MigrationResult,
} from './unifyModels';
import { getDatabase } from '../getDatabase';

/**
 * Example 1: Basic migration with error handling
 */
export async function example1_BasicMigration() {
  console.log('=== Example 1: Basic Migration ===');

  try {
    const db = await getDatabase();

    // Run migration
    console.log('Starting migration...');
    const result = await migrateToUnifiedModel(db);

    if (result.success) {
      console.log('Migration completed successfully!');
      console.log('Migration details:', {
        receipts: result.receiptsCount,
        documents: result.documentsCount,
        reportLinks: result.reportLinksCount,
        timestamp: result.timestamp,
      });
    } else {
      console.error('Migration failed!');
      console.error('Errors:', result.errors);
    }
  } catch (error) {
    console.error('Unexpected error during migration:', error);
  }
}

/**
 * Example 2: Migration with backup
 */
export async function example2_MigrationWithBackup() {
  console.log('=== Example 2: Migration with Backup ===');

  try {
    // Step 1: Create backup
    console.log('Creating database backup...');
    const dbPath = `${FileSystem.documentDirectory}SQLite/receipt_tool.db`;
    const backupPath = `${FileSystem.documentDirectory}SQLite/receipt_tool_backup_${Date.now()}.db`;

    await FileSystem.copyAsync({
      from: dbPath,
      to: backupPath,
    });
    console.log('Backup created:', backupPath);

    // Step 2: Run migration
    const db = await getDatabase();
    console.log('Starting migration...');
    const result = await migrateToUnifiedModel(db);

    if (result.success) {
      console.log('Migration successful! Backup can be deleted if desired.');

      // Optional: Delete backup after verification
      // await FileSystem.deleteAsync(backupPath);
    } else {
      console.error('Migration failed! Restore from backup:', backupPath);
      // Could implement automatic rollback here
    }
  } catch (error) {
    console.error('Error during migration with backup:', error);
  }
}

/**
 * Example 3: Migration with verification
 */
export async function example3_MigrationWithVerification() {
  console.log('=== Example 3: Migration with Verification ===');

  try {
    const db = await getDatabase();

    // Run migration
    const result = await migrateToUnifiedModel(db);

    if (!result.success) {
      console.error('Migration failed:', result.errors);
      return;
    }

    console.log('Migration completed, running verification...');

    // Verify migration
    const isValid = await verifyUnifiedModelMigration(db);

    if (isValid) {
      console.log('Verification passed! Migration is valid.');

      // Get statistics
      const stats = await getMigrationStatistics(db);
      console.log('Migration statistics:', {
        total: stats.itemsTotal,
        fromReceipts: stats.receiptSource,
        fromDocuments: stats.documentSource,
      });

      console.log('Classification breakdown:');
      stats.classificationBreakdown.forEach((item) => {
        console.log(`  ${item.classification}: ${item.count}`);
      });

      console.log('Purpose breakdown:');
      stats.purposeBreakdown.forEach((item) => {
        console.log(`  ${item.usage_purpose}: ${item.count}`);
      });
    } else {
      console.error('Verification failed! Migration may be corrupted.');
    }
  } catch (error) {
    console.error('Error during migration verification:', error);
  }
}

/**
 * Example 4: Check migration status before running
 */
export async function example4_CheckBeforeMigration() {
  console.log('=== Example 4: Check Before Migration ===');

  try {
    const db = await getDatabase();

    // Check if items table has data
    const itemsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items'
    );

    if (itemsCount && itemsCount.count > 0) {
      console.log('Migration has already been run.');
      console.log(`Found ${itemsCount.count} items in database.`);

      // Get statistics
      const stats = await getMigrationStatistics(db);
      console.log('Current statistics:', stats);
    } else {
      console.log('Migration has not been run yet.');

      // Check source data
      const receiptsCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM receipts'
      );
      const documentsCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM documents'
      );

      console.log('Source data:');
      console.log(`  Receipts: ${receiptsCount?.count || 0}`);
      console.log(`  Documents: ${documentsCount?.count || 0}`);

      // Run migration
      console.log('Starting migration...');
      const result = await migrateToUnifiedModel(db);

      if (result.success) {
        console.log('Migration completed successfully!');
      }
    }
  } catch (error) {
    console.error('Error checking migration status:', error);
  }
}

/**
 * Example 5: Query items after migration
 */
export async function example5_QueryAfterMigration() {
  console.log('=== Example 5: Query Items After Migration ===');

  try {
    const db = await getDatabase();

    // Get all corporate card meal expenses
    const corporateMeals = await db.getAllAsync<any>(
      `SELECT
        id,
        title,
        amount,
        date,
        store_name
      FROM items
      WHERE classification = 'corporate_card'
        AND usage_purpose = 'meal'
      ORDER BY date DESC
      LIMIT 10`
    );

    console.log('Recent corporate meal expenses:');
    corporateMeals.forEach((item) => {
      console.log(
        `  ${item.date}: ${item.title} - $${item.amount} at ${item.store_name || 'Unknown'}`
      );
    });

    // Get total by classification
    const totals = await db.getAllAsync<{
      classification: string;
      total: number;
      count: number;
    }>(
      `SELECT
        classification,
        COUNT(*) as count,
        SUM(COALESCE(amount, 0)) as total
      FROM items
      GROUP BY classification
      ORDER BY total DESC`
    );

    console.log('\nTotals by classification:');
    totals.forEach((item) => {
      console.log(
        `  ${item.classification}: ${item.count} items, $${item.total.toFixed(2)} total`
      );
    });

    // Get total by purpose
    const purposeTotals = await db.getAllAsync<{
      usage_purpose: string;
      total: number;
      count: number;
    }>(
      `SELECT
        usage_purpose,
        COUNT(*) as count,
        SUM(COALESCE(amount, 0)) as total
      FROM items
      GROUP BY usage_purpose
      ORDER BY total DESC`
    );

    console.log('\nTotals by purpose:');
    purposeTotals.forEach((item) => {
      console.log(
        `  ${item.usage_purpose}: ${item.count} items, $${item.total.toFixed(2)} total`
      );
    });

    // Get items in a specific report
    const reportId = 'some-report-id';
    const reportItems = await db.getAllAsync<any>(
      `SELECT
        i.id,
        i.title,
        i.classification,
        i.usage_purpose,
        i.amount,
        i.date
      FROM items i
      JOIN report_items ri ON ri.item_id = i.id
      WHERE ri.report_id = ?
      ORDER BY i.date DESC`,
      [reportId]
    );

    console.log(`\nItems in report ${reportId}:`);
    console.log(`Found ${reportItems.length} items`);
  } catch (error) {
    console.error('Error querying items:', error);
  }
}

/**
 * Example 6: Compare source and migrated data
 */
export async function example6_CompareData() {
  console.log('=== Example 6: Compare Source and Migrated Data ===');

  try {
    const db = await getDatabase();

    // Compare counts
    const receiptsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM receipts'
    );
    const documentsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM documents'
    );
    const itemsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM items'
    );

    const sourceTotal = (receiptsCount?.count || 0) + (documentsCount?.count || 0);
    const migratedTotal = itemsCount?.count || 0;

    console.log('Count comparison:');
    console.log(`  Receipts: ${receiptsCount?.count || 0}`);
    console.log(`  Documents: ${documentsCount?.count || 0}`);
    console.log(`  Total source: ${sourceTotal}`);
    console.log(`  Items migrated: ${migratedTotal}`);
    console.log(`  Match: ${sourceTotal === migratedTotal ? 'YES' : 'NO'}`);

    // Sample data comparison
    const sampleReceipt = await db.getFirstAsync<any>(
      'SELECT * FROM receipts LIMIT 1'
    );
    if (sampleReceipt) {
      const migratedItem = await db.getFirstAsync<any>(
        'SELECT * FROM items WHERE id = ?',
        [sampleReceipt.id]
      );

      console.log('\nSample receipt comparison:');
      console.log('Original receipt:', {
        id: sampleReceipt.id,
        title: sampleReceipt.title,
        receipt_type: sampleReceipt.receipt_type,
        category_id: sampleReceipt.category_id,
        amount: sampleReceipt.amount,
      });
      console.log('Migrated item:', {
        id: migratedItem?.id,
        title: migratedItem?.title,
        classification: migratedItem?.classification,
        usage_purpose: migratedItem?.usage_purpose,
        amount: migratedItem?.amount,
      });
    }

    // Report associations comparison
    const reportReceiptsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM report_receipts'
    );
    const reportDocumentsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM report_documents'
    );
    const reportItemsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM report_items'
    );

    const sourceLinksTotal =
      (reportReceiptsCount?.count || 0) + (reportDocumentsCount?.count || 0);
    const migratedLinksTotal = reportItemsCount?.count || 0;

    console.log('\nReport association comparison:');
    console.log(`  Report-Receipts: ${reportReceiptsCount?.count || 0}`);
    console.log(`  Report-Documents: ${reportDocumentsCount?.count || 0}`);
    console.log(`  Total source links: ${sourceLinksTotal}`);
    console.log(`  Report-Items: ${migratedLinksTotal}`);
    console.log(`  Match: ${sourceLinksTotal === migratedLinksTotal ? 'YES' : 'NO'}`);
  } catch (error) {
    console.error('Error comparing data:', error);
  }
}

/**
 * Example 7: Error handling and recovery
 */
export async function example7_ErrorHandling() {
  console.log('=== Example 7: Error Handling and Recovery ===');

  try {
    const db = await getDatabase();

    // Run migration with comprehensive error handling
    let result: MigrationResult;

    try {
      result = await migrateToUnifiedModel(db);
    } catch (error) {
      console.error('Migration threw an exception:', error);

      // Check database state
      const itemsCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM items'
      );

      console.log('Database state after error:');
      console.log(`  Items count: ${itemsCount?.count || 0}`);

      // Migration should have rolled back, so items count should be 0
      if (itemsCount && itemsCount.count > 0) {
        console.warn('WARNING: Transaction may not have rolled back properly!');
      } else {
        console.log('Transaction rolled back successfully.');
      }

      return;
    }

    // Check result
    if (result.success) {
      console.log('Migration succeeded without errors.');
    } else {
      console.log('Migration completed with errors:');
      result.errors.forEach((error, index) => {
        console.log(`  Error ${index + 1}: ${error}`);
      });

      // Attempt to diagnose issues
      console.log('\nDiagnosing issues...');

      // Check table existence
      const tables = ['receipts', 'documents', 'items', 'usage_purposes', 'report_items'];
      for (const tableName of tables) {
        const exists = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM sqlite_master
           WHERE type='table' AND name=?`,
          [tableName]
        );
        console.log(`  Table '${tableName}': ${exists?.count ? 'EXISTS' : 'MISSING'}`);
      }
    }
  } catch (error) {
    console.error('Unexpected error in error handling example:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('Running all unified model migration examples...\n');

  await example1_BasicMigration();
  console.log('\n');

  await example2_MigrationWithBackup();
  console.log('\n');

  await example3_MigrationWithVerification();
  console.log('\n');

  await example4_CheckBeforeMigration();
  console.log('\n');

  await example5_QueryAfterMigration();
  console.log('\n');

  await example6_CompareData();
  console.log('\n');

  await example7_ErrorHandling();
  console.log('\n');

  console.log('All examples completed!');
}
