/**
 * Database Utility Functions
 *
 * Common helper functions for database operations
 */

import { getDatabase } from './getDatabase';

/**
 * Execute a database operation within a transaction
 *
 * @param operations - Async function containing database operations
 * @returns Promise<T> - Result of the operations
 */
export async function executeTransaction<T>(
  operations: () => Promise<T>
): Promise<T> {
  const db = await getDatabase();

  try {
    await db.execAsync('BEGIN TRANSACTION');
    const result = await operations();
    await db.execAsync('COMMIT');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

/**
 * Check if a table exists in the database
 *
 * @param tableName - Name of the table to check
 * @returns Promise<boolean> - True if table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName]
  );

  return (result?.count ?? 0) > 0;
}

/**
 * Get the total number of rows in a table
 *
 * @param tableName - Name of the table
 * @returns Promise<number> - Number of rows
 */
export async function getTableRowCount(tableName: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${tableName}`
  );

  return result?.count ?? 0;
}

/**
 * Execute raw SQL query (use with caution)
 *
 * @param query - SQL query string
 * @param params - Query parameters
 * @returns Promise<any[]> - Query results
 */
export async function executeRawQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const db = await getDatabase();
  return await db.getAllAsync<T>(query, params);
}

/**
 * Get database statistics
 *
 * @returns Promise<object> - Database statistics including table row counts
 */
export async function getDatabaseStatistics(): Promise<{
  receipts: number;
  receiptItems: number;
  reports: number;
  reportReceipts: number;
  categories: number;
  databaseSize: number;
}> {
  const receipts = await getTableRowCount('receipts');
  const receiptItems = await getTableRowCount('receipt_items');
  const reports = await getTableRowCount('reports');
  const reportReceipts = await getTableRowCount('report_receipts');
  const categories = await getTableRowCount('categories');

  // Get database file size (in pages)
  const db = await getDatabase();
  const pageCountResult = await db.getFirstAsync<{ page_count: number }>(
    'PRAGMA page_count'
  );
  const pageSizeResult = await db.getFirstAsync<{ page_size: number }>(
    'PRAGMA page_size'
  );

  const pageCount = pageCountResult?.page_count ?? 0;
  const pageSize = pageSizeResult?.page_size ?? 0;
  const databaseSize = pageCount * pageSize; // Size in bytes

  return {
    receipts,
    receiptItems,
    reports,
    reportReceipts,
    categories,
    databaseSize,
  };
}

/**
 * Vacuum the database to reclaim unused space
 *
 * @returns Promise<void>
 */
export async function vacuumDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('VACUUM');
  console.log('Database vacuumed successfully');
}

/**
 * Analyze the database to update query optimizer statistics
 *
 * @returns Promise<void>
 */
export async function analyzeDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('ANALYZE');
  console.log('Database analyzed successfully');
}

/**
 * Check database integrity
 *
 * @returns Promise<boolean> - True if database integrity is OK
 */
export async function checkDatabaseIntegrity(): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ integrity_check: string }>(
    'PRAGMA integrity_check'
  );

  return result?.integrity_check === 'ok';
}

/**
 * Get foreign key violations
 *
 * @returns Promise<any[]> - Array of foreign key violations
 */
export async function checkForeignKeys(): Promise<any[]> {
  const db = await getDatabase();
  return await db.getAllAsync('PRAGMA foreign_key_check');
}

/**
 * Generate a unique ID using timestamp and random string
 *
 * @returns string - Unique ID
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Format date to ISO string for database storage
 *
 * @param date - Date object or date string
 * @returns string - ISO date string
 */
export function formatDateForDb(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * Parse ISO date string from database
 *
 * @param dateString - ISO date string
 * @returns Date - Date object
 */
export function parseDateFromDb(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Sanitize string for SQL LIKE query
 *
 * @param input - Input string
 * @returns string - Sanitized string
 */
export function sanitizeLikeQuery(input: string): string {
  return input.replace(/[%_]/g, '\\$&');
}

/**
 * Build dynamic WHERE clause from filters
 *
 * @param filters - Object with filter conditions
 * @returns object - Query string and parameters
 */
export function buildWhereClause(
  filters: Record<string, any>
): { where: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return { where, params };
}
