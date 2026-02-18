/**
 * Database Instance Helper
 *
 * Provides a consistent way to get the database instance.
 * Uses a singleton promise to prevent concurrent initialization issues.
 */

import { initDatabase, getDatabaseInstance } from './init';
import type * as SQLite from 'expo-sqlite';

/**
 * Get database instance, initializing if needed.
 * initDatabase() itself handles concurrent calls via singleton promise.
 *
 * @returns Promise<SQLite.SQLiteDatabase>
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  const existingDb = getDatabaseInstance();
  if (existingDb) {
    return existingDb;
  }

  return initDatabase();
}
