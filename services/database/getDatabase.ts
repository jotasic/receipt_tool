/**
 * Database Instance Helper
 *
 * Provides a consistent way to get the database instance
 */

import { initDatabase, getDatabaseInstance } from './init';
import type * as SQLite from 'expo-sqlite';

/**
 * Get database instance, initializing if needed
 *
 * @returns Promise<SQLite.SQLiteDatabase>
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  const existingDb = getDatabaseInstance();
  if (existingDb) {
    return existingDb;
  }
  return await initDatabase();
}
