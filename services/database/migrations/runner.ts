/**
 * Migration Runner
 *
 * Sequential migration executor with version tracking via db_migrations table.
 * Guarantees ordered, idempotent application of all pending migrations.
 */

import * as SQLite from 'expo-sqlite';
import { migrateToUnifiedModel } from './unifyModels';
import { migrateDocumentTypes } from './migrateDocumentTypes';
import { migrateSpaceFeature } from './spaceFeature';

export interface MigrationProgress {
  message: string;
  current?: number;
  total?: number;
}

export type MigrationProgressCallback = (progress: MigrationProgress) => void;

interface Migration {
  version: number;
  name: string;
  run: (db: SQLite.SQLiteDatabase, onProgress?: MigrationProgressCallback) => Promise<void>;
}

// Version helpers

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM db_migrations'
    );
    return result?.version ?? 0;
  } catch (err) {
    // Expected on first run (table not yet created). Any other error is unusual.
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('no such table')) {
      console.warn('[MigrationRunner] Unexpected error reading db_migrations:', message);
    }
    return 0;
  }
}

/**
 * Detect which migrations have already been applied on a legacy database
 * that predates the db_migrations version tracking table.
 *
 * Uses data-state heuristics:
 * - v2 done: all receipts IDs are present in items (or receipts is empty)
 * - v3 done: no deprecated document types remain
 */
async function detectCompletedMigrationsForLegacyDb(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  try {
    // Check v2: receipts have been migrated to items
    const receiptsResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM receipts'
    );
    const totalReceipts = receiptsResult?.count ?? 0;

    let v2Done: boolean;
    if (totalReceipts === 0) {
      // No receipts to migrate → v2 was a no-op
      v2Done = true;
    } else {
      const migratedResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM items WHERE id IN (SELECT id FROM receipts)'
      );
      v2Done = (migratedResult?.count ?? 0) >= totalReceipts;
    }

    // Check v3: no deprecated document types remain
    const deprecatedResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM documents
       WHERE document_type IN ('contract', 'estimate', 'invoice')`
    );
    const v3Done = (deprecatedResult?.count ?? 0) === 0;

    if (v2Done && v3Done) return 3;
    if (v2Done) return 2;
    return 0;
  } catch {
    return 0;
  }
}

async function recordMigration(
  db: SQLite.SQLiteDatabase,
  version: number,
  name: string
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO db_migrations (version, name) VALUES (?, ?)',
    [version, name]
  );
}

// Individual migration implementations

// v1: initial_schema
// Schema creation is handled by init.ts (CREATE TABLE IF NOT EXISTS).
// This entry exists to stamp existing databases as v1 so subsequent
// migrations are not skipped on first run after adding the runner.
async function migrateV1(_db: SQLite.SQLiteDatabase): Promise<void> {
  // Intentionally empty - idempotent marker only
}

// v2: unified_model - receipts + documents → items
async function migrateV2(
  db: SQLite.SQLiteDatabase,
  onProgress?: MigrationProgressCallback
): Promise<void> {
  onProgress?.({ message: '데이터 모델 통합 중...' });
  await migrateToUnifiedModel(db);
}

// v3: document_types - deprecated types → other
async function migrateV3(
  db: SQLite.SQLiteDatabase,
  onProgress?: MigrationProgressCallback
): Promise<void> {
  onProgress?.({ message: '문서 유형 업데이트 중...' });
  await migrateDocumentTypes(db);
}

// v4: space_feature - spaces + classifications tables, migrate existing items
async function migrateV4(
  db: SQLite.SQLiteDatabase,
  onProgress?: MigrationProgressCallback
): Promise<void> {
  await migrateSpaceFeature(db, onProgress);
}

export const ALL_MIGRATIONS: Migration[] = [
  { version: 1, name: 'initial_schema', run: migrateV1 },
  { version: 2, name: 'unified_model', run: migrateV2 },
  { version: 3, name: 'document_types', run: migrateV3 },
  { version: 4, name: 'space_feature', run: migrateV4 },
];

/**
 * Run all pending migrations in ascending version order.
 *
 * Each migration is recorded in db_migrations immediately after completion
 * so that a crash mid-run resumes from the correct point on the next launch.
 *
 * @param db - Initialized SQLite database instance
 * @param onProgress - Optional progress callback
 */
export async function runMigrations(
  db: SQLite.SQLiteDatabase,
  onProgress?: MigrationProgressCallback
): Promise<void> {
  let currentVersion = await getCurrentVersion(db);

  // For legacy databases that predate the migration runner, detect which
  // migrations have already been applied and stamp them to avoid re-running.
  if (currentVersion === 0) {
    const legacyVersion = await detectCompletedMigrationsForLegacyDb(db);
    if (legacyVersion > 0) {
      console.log(`[MigrationRunner] Legacy DB detected at v${legacyVersion}, stamping...`);
      for (const m of ALL_MIGRATIONS.filter((m) => m.version <= legacyVersion)) {
        await recordMigration(db, m.version, m.name);
      }
      currentVersion = legacyVersion;
    }
  }

  const pending = ALL_MIGRATIONS.filter((m) => m.version > currentVersion);

  if (pending.length === 0) {
    console.log('[MigrationRunner] DB is up to date (version', currentVersion, ')');
    return;
  }

  const total = pending.length;
  console.log(
    `[MigrationRunner] Current version: ${currentVersion}, pending: ${pending.length}`
  );

  for (let i = 0; i < pending.length; i++) {
    const migration = pending[i];
    const step = i + 1;

    onProgress?.({
      message: `업데이트 ${step}/${total} 진행 중...`,
      current: step,
      total,
    });

    console.log(`[MigrationRunner] Running v${migration.version}: ${migration.name}`);
    await migration.run(db, onProgress);
    await recordMigration(db, migration.version, migration.name);

    onProgress?.({
      message: `업데이트 ${step}/${total} 완료`,
      current: step,
      total,
    });

    console.log(`[MigrationRunner] Completed v${migration.version}: ${migration.name}`);
  }

  console.log('[MigrationRunner] All migrations applied successfully');
}
