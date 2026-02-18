/**
 * Database Instance Helper
 *
 * Provides a consistent way to get the database instance.
 * Uses a singleton promise to prevent concurrent initialization issues.
 */

import { initDatabase, getDatabaseInstance } from './init';
import type * as SQLite from 'expo-sqlite';

// Pending initialization promise - prevents concurrent initDatabase() calls
let pendingInit: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Get database instance, initializing if needed.
 * Concurrent callers share the same initialization promise.
 *
 * @returns Promise<SQLite.SQLiteDatabase>
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  const existingDb = getDatabaseInstance();
  if (existingDb) {
    return existingDb;
  }

  if (!pendingInit) {
    pendingInit = initDatabase().catch((err) => {
      pendingInit = null; // reset on error so retry is possible
      throw err;
    });
  }

  return pendingInit;
}
