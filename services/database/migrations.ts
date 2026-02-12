/**
 * Database Migration System
 *
 * Handles schema versioning and migrations for future updates
 */

import * as SQLite from 'expo-sqlite';
import { getDatabaseInstance } from './init';

const CURRENT_VERSION = 3;

/**
 * Migration definition interface
 */
interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
  down?: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * Get current database schema version
 */
async function getDatabaseVersion(db: SQLiteDatabase): Promise<number> {
  try {
    // Create version table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      )
    `);

    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );

    return result?.version || 0;
  } catch (error) {
    console.error('Failed to get database version:', error);
    return 0;
  }
}

/**
 * Set database version
 */
async function setDatabaseVersion(
  db: SQLiteDatabase,
  version: number
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
    version,
    now
  );
}

/**
 * Run pending migrations
 */
export async function runMigrations(): Promise<void> {
  const db = getDatabaseInstance();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const currentVersion = await getDatabaseVersion(db);
  console.log(`Current database version: ${currentVersion}`);

  if (currentVersion >= CURRENT_VERSION) {
    console.log('Database is up to date');
    return;
  }

  // Get migrations to apply
  const pendingMigrations = MIGRATIONS.filter(
    (m) => m.version > currentVersion && m.version <= CURRENT_VERSION
  );

  if (pendingMigrations.length === 0) {
    console.log('No migrations to apply');
    return;
  }

  console.log(`Applying ${pendingMigrations.length} migration(s)...`);

  for (const migration of pendingMigrations) {
    try {
      console.log(`Applying migration ${migration.version}...`);
      await db.execAsync('BEGIN TRANSACTION');
      await migration.up(db);
      await setDatabaseVersion(db, migration.version);
      await db.execAsync('COMMIT');
      console.log(`Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error);
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  console.log('All migrations applied successfully');
}

/**
 * Rollback to a specific version
 * WARNING: This may cause data loss
 */
export async function rollbackToVersion(targetVersion: number): Promise<void> {
  const db = getDatabaseInstance();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const currentVersion = await getDatabaseVersion(db);

  if (targetVersion >= currentVersion) {
    console.log('Target version is current or higher, no rollback needed');
    return;
  }

  // Get migrations to rollback
  const migrationsToRollback = MIGRATIONS.filter(
    (m) => m.version > targetVersion && m.version <= currentVersion
  ).sort((a, b) => b.version - a.version); // Rollback in reverse order

  console.log(`Rolling back ${migrationsToRollback.length} migration(s)...`);

  for (const migration of migrationsToRollback) {
    if (!migration.down) {
      throw new Error(
        `Migration ${migration.version} does not support rollback`
      );
    }

    try {
      console.log(`Rolling back migration ${migration.version}...`);
      await db.execAsync('BEGIN TRANSACTION');
      await migration.down(db);
      await db.runAsync(
        'DELETE FROM schema_version WHERE version = ?',
        migration.version
      );
      await db.execAsync('COMMIT');
      console.log(`Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      console.error(`Rollback of migration ${migration.version} failed:`, error);
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  console.log(`Rolled back to version ${targetVersion}`);
}

/**
 * Migration definitions
 * Add new migrations here as the schema evolves
 */
const MIGRATIONS: Migration[] = [
  // Version 1: Initial schema (already applied by init.ts)
  {
    version: 1,
    up: async (db) => {
      // Initial schema is created by init.ts
      // This migration exists for version tracking
      console.log('Version 1: Initial schema (already applied)');
    },
    down: async (db) => {
      console.log('Cannot rollback initial schema');
    },
  },

  // Version 2: Add receipt_type, memo fields and documents table
  {
    version: 2,
    up: async (db) => {
      // Add receipt_type column to receipts table
      await db.execAsync(`
        ALTER TABLE receipts ADD COLUMN receipt_type TEXT DEFAULT 'corporate' CHECK(receipt_type IN ('corporate', 'personal'))
      `);
      console.log('Added receipt_type column to receipts table');

      // Add memo column to receipts table
      await db.execAsync(`
        ALTER TABLE receipts ADD COLUMN memo TEXT
      `);
      console.log('Added memo column to receipts table');

      // Create documents table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          file_path TEXT,
          file_type TEXT,
          memo TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      console.log('Created documents table');

      // Create indexes
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_receipts_type ON receipts(receipt_type)
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC)
      `);
      console.log('Created indexes for receipts_type and documents_created');
    },
    down: async (db) => {
      // SQLite doesn't support DROP COLUMN, would need to recreate table
      throw new Error('Cannot rollback Version 2 migration');
    },
  },

  // Version 3: Add tags and tag junction tables
  {
    version: 3,
    up: async (db) => {
      // Create tags table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT DEFAULT '#6B7280',
          created_at TEXT NOT NULL
        )
      `);
      console.log('Created tags table');

      // Create receipt_tags junction table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS receipt_tags (
          receipt_id TEXT NOT NULL,
          tag_id TEXT NOT NULL,
          PRIMARY KEY (receipt_id, tag_id),
          FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
      `);
      console.log('Created receipt_tags table');

      // Create document_tags junction table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS document_tags (
          document_id TEXT NOT NULL,
          tag_id TEXT NOT NULL,
          PRIMARY KEY (document_id, tag_id),
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
      `);
      console.log('Created document_tags table');

      // Create indexes for tags
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_receipt_tags_receipt ON receipt_tags(receipt_id)`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_receipt_tags_tag ON receipt_tags(tag_id)`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_document_tags_document ON document_tags(document_id)`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag_id)`);
      console.log('Created indexes for tags');
    },
    down: async (db) => {
      await db.execAsync('DROP TABLE IF EXISTS document_tags');
      await db.execAsync('DROP TABLE IF EXISTS receipt_tags');
      await db.execAsync('DROP TABLE IF EXISTS tags');
      console.log('Dropped tags tables');
    },
  },
];

/**
 * Check if migrations are needed
 */
export async function checkMigrationsNeeded(): Promise<boolean> {
  const db = getDatabaseInstance();
  if (!db) return false;

  const currentVersion = await getDatabaseVersion(db);
  return currentVersion < CURRENT_VERSION;
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  currentVersion: number;
  targetVersion: number;
  pendingCount: number;
}> {
  const db = getDatabaseInstance();
  if (!db) {
    return { currentVersion: 0, targetVersion: CURRENT_VERSION, pendingCount: 0 };
  }

  const currentVersion = await getDatabaseVersion(db);
  const pendingCount = MIGRATIONS.filter(
    (m) => m.version > currentVersion && m.version <= CURRENT_VERSION
  ).length;

  return {
    currentVersion,
    targetVersion: CURRENT_VERSION,
    pendingCount,
  };
}

// Re-export SQLiteDatabase type
type SQLiteDatabase = SQLite.SQLiteDatabase;
