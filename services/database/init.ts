/**
 * Database Initialization Module
 *
 * Handles SQLite database creation, schema setup, and initial data seeding
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA, INDEXES, DEFAULT_CATEGORIES } from './schema';

export const DB_NAME = 'receipt_tool.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the SQLite database
 *
 * Creates all tables, indexes, and seeds default categories
 * @returns Promise<SQLite.SQLiteDatabase> - The initialized database instance
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Return existing instance if already initialized
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Open database connection
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    console.log('Database opened successfully:', DB_NAME);

    // Enable foreign key constraints
    await db.execAsync('PRAGMA foreign_keys = ON;');
    console.log('Foreign key constraints enabled');

    // Create tables in dependency order
    await db.execAsync(SCHEMA.categories);
    console.log('Created categories table');

    await db.execAsync(SCHEMA.receipts);
    console.log('Created receipts table');

    await db.execAsync(SCHEMA.receipt_items);
    console.log('Created receipt_items table');

    await db.execAsync(SCHEMA.reports);
    console.log('Created reports table');

    await db.execAsync(SCHEMA.report_receipts);
    console.log('Created report_receipts table');

    // Create indexes for performance optimization
    await db.execAsync(INDEXES.receipts_date);
    await db.execAsync(INDEXES.receipts_category);
    await db.execAsync(INDEXES.receipt_items_receipt);
    await db.execAsync(INDEXES.reports_status);
    await db.execAsync(INDEXES.reports_created);
    console.log('Created all indexes');

    // Seed default categories
    await seedDefaultCategories(db);

    dbInstance = db;
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Seed default categories if they don't exist
 *
 * @param db - The database instance
 */
async function seedDefaultCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if categories already exist
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories'
    );

    if (result && result.count > 0) {
      console.log(`Categories already exist (${result.count} found), skipping seed`);
      return;
    }

    // Insert default categories
    const insertStatement = `
      INSERT OR IGNORE INTO categories (id, name, icon, color)
      VALUES (?, ?, ?, ?)
    `;

    for (const category of DEFAULT_CATEGORIES) {
      await db.runAsync(
        insertStatement,
        category.id,
        category.name,
        category.icon,
        category.color
      );
    }

    console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories`);
  } catch (error) {
    console.error('Failed to seed default categories:', error);
    throw error;
  }
}

/**
 * Get the current database instance
 *
 * @returns The database instance or null if not initialized
 */
export function getDatabaseInstance(): SQLite.SQLiteDatabase | null {
  return dbInstance;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    console.log('Database closed');
  }
}

/**
 * Reset the database (drop all tables and reinitialize)
 * WARNING: This will delete all data
 */
export async function resetDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Drop all tables in reverse dependency order
    await db.execAsync('DROP TABLE IF EXISTS report_receipts');
    await db.execAsync('DROP TABLE IF EXISTS reports');
    await db.execAsync('DROP TABLE IF EXISTS receipt_items');
    await db.execAsync('DROP TABLE IF EXISTS receipts');
    await db.execAsync('DROP TABLE IF EXISTS categories');

    console.log('All tables dropped');

    // Close and reinitialize
    await db.closeAsync();
    dbInstance = null;

    return await initDatabase();
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
}

export { DB_NAME as DATABASE_NAME };
