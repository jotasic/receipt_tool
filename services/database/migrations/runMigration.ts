/**
 * CLI Script to manually run document type migration
 *
 * Usage:
 *   npx ts-node services/database/migrations/runMigration.ts [command]
 *
 * Commands:
 *   migrate  - Run the migration
 *   verify   - Verify migration status
 *   check    - Check how many documents need migration
 *   dry-run  - Show what will be migrated without making changes
 */

import * as SQLite from 'expo-sqlite';
import {
  migrateDocumentTypes,
  verifyDocumentTypeMigration,
} from './migrateDocumentTypes';

const DB_NAME = 'receipt_tool.db';

/**
 * Check how many documents need migration
 */
async function checkMigrationNeeded() {
  console.log('Checking migration status...\n');

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  try {
    // Check if table exists
    const tableExists = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master
       WHERE type='table' AND name='documents'`
    );

    if (!tableExists || tableExists.count === 0) {
      console.log('❌ Documents table does not exist');
      return;
    }

    // Get total document count
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM documents'
    );
    const total = totalResult?.count || 0;

    // Get deprecated types count
    const deprecatedResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM documents
       WHERE document_type IN ('contract', 'estimate', 'invoice')`
    );
    const deprecated = deprecatedResult?.count || 0;

    // Get breakdown by type
    const breakdown = await db.getAllAsync<{
      document_type: string;
      count: number;
    }>(
      `SELECT document_type, COUNT(*) as count FROM documents
       GROUP BY document_type
       ORDER BY count DESC`
    );

    console.log('📊 Document Statistics:');
    console.log(`   Total documents: ${total}`);
    console.log(`   Deprecated types: ${deprecated}`);
    console.log(`   Already migrated: ${total - deprecated}\n`);

    if (breakdown.length > 0) {
      console.log('📈 Breakdown by type:');
      breakdown.forEach((row) => {
        const status = ['contract', 'estimate', 'invoice'].includes(
          row.document_type
        )
          ? '❌ (will migrate)'
          : '✅';
        console.log(`   ${status} ${row.document_type}: ${row.count}`);
      });
    }

    if (deprecated > 0) {
      console.log(`\n⚠️  Migration needed for ${deprecated} document(s)`);
    } else {
      console.log('\n✅ No migration needed - all documents have valid types');
    }
  } finally {
    await db.closeAsync();
  }
}

/**
 * Perform dry run - show what would be migrated
 */
async function dryRun() {
  console.log('🔍 Dry run - showing documents that would be migrated...\n');

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  try {
    const documents = await db.getAllAsync<{
      id: string;
      title: string;
      document_type: string;
      created_at: string;
    }>(
      `SELECT id, title, document_type, created_at FROM documents
       WHERE document_type IN ('contract', 'estimate', 'invoice')
       ORDER BY created_at DESC`
    );

    if (documents.length === 0) {
      console.log('✅ No documents need migration');
      return;
    }

    console.log(`Found ${documents.length} document(s) to migrate:\n`);

    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Current type: ${doc.document_type} → Will become: other`);
      console.log(`   Created: ${doc.created_at}\n`);
    });

    console.log('⚠️  No changes made (dry run mode)');
  } finally {
    await db.closeAsync();
  }
}

/**
 * Run the migration
 */
async function runMigration() {
  console.log('🚀 Running document type migration...\n');

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  try {
    await migrateDocumentTypes(db);
    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.closeAsync();
  }
}

/**
 * Verify migration status
 */
async function verifyMigration() {
  console.log('🔍 Verifying migration status...\n');

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  try {
    const isValid = await verifyDocumentTypeMigration(db);

    if (isValid) {
      console.log('✅ Migration verification PASSED');
      console.log('   No deprecated document types found\n');
    } else {
      console.log('❌ Migration verification FAILED');
      console.log('   Some documents still have deprecated types\n');

      // Show which ones
      const remaining = await db.getAllAsync<{
        id: string;
        title: string;
        document_type: string;
      }>(
        `SELECT id, title, document_type FROM documents
         WHERE document_type IN ('contract', 'estimate', 'invoice')`
      );

      console.log(`Found ${remaining.length} document(s) with deprecated types:`);
      remaining.forEach((doc) => {
        console.log(`   - ${doc.title} (${doc.document_type})`);
      });
    }
  } finally {
    await db.closeAsync();
  }
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Document Type Migration Tool

Usage:
  npx ts-node services/database/migrations/runMigration.ts [command]

Commands:
  check    - Check migration status and show statistics
  dry-run  - Show what will be migrated without making changes
  migrate  - Run the migration (updates database)
  verify   - Verify migration completed successfully
  help     - Show this help message

Examples:
  # Check what needs migration
  npx ts-node services/database/migrations/runMigration.ts check

  # Preview changes without modifying data
  npx ts-node services/database/migrations/runMigration.ts dry-run

  # Run the migration
  npx ts-node services/database/migrations/runMigration.ts migrate

  # Verify it worked
  npx ts-node services/database/migrations/runMigration.ts verify
`);
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'help';

  console.log('═══════════════════════════════════════════════');
  console.log('  Document Type Migration Tool');
  console.log('═══════════════════════════════════════════════\n');

  try {
    switch (command) {
      case 'check':
        await checkMigrationNeeded();
        break;

      case 'dry-run':
        await dryRun();
        break;

      case 'migrate':
        await runMigration();
        break;

      case 'verify':
        await verifyMigration();
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

export { checkMigrationNeeded, dryRun, runMigration, verifyMigration };
