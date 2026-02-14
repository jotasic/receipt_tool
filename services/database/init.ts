/**
 * Database Initialization Module
 *
 * Handles SQLite database creation, schema setup, and initial data seeding
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA, INDEXES, DEFAULT_CATEGORIES } from './schema';
import { migrateDocumentTypes } from './migrations/migrateDocumentTypes';
import { migrateToUnifiedModel, MigrationResult } from './migrations/unifyModels';

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
    // Core tables
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

    // Document management tables
    await db.execAsync(SCHEMA.documents);
    console.log('Created documents table');

    await db.execAsync(SCHEMA.report_documents);
    console.log('Created report_documents table');

    // Tag system tables
    await db.execAsync(SCHEMA.tags);
    console.log('Created tags table');

    await db.execAsync(SCHEMA.receipt_tags);
    console.log('Created receipt_tags table');

    await db.execAsync(SCHEMA.document_tags);
    console.log('Created document_tags table');

    // Custom fields tables
    await db.execAsync(SCHEMA.custom_fields);
    console.log('Created custom_fields table');

    await db.execAsync(SCHEMA.receipt_custom_values);
    console.log('Created receipt_custom_values table');

    await db.execAsync(SCHEMA.document_custom_values);
    console.log('Created document_custom_values table');

    // Unified model tables
    await db.execAsync(SCHEMA.usage_purposes);
    console.log('Created usage_purposes table');

    await db.execAsync(SCHEMA.items);
    console.log('Created items table');

    await db.execAsync(SCHEMA.report_items);
    console.log('Created report_items table');

    // Create indexes for performance optimization
    // Receipt indexes
    await db.execAsync(INDEXES.receipts_date);
    await db.execAsync(INDEXES.receipts_category);
    await db.execAsync(INDEXES.receipts_type);
    await db.execAsync(INDEXES.receipt_items_receipt);

    // Report indexes
    await db.execAsync(INDEXES.reports_status);
    await db.execAsync(INDEXES.reports_created);

    // Document indexes
    await db.execAsync(INDEXES.documents_created);
    await db.execAsync(INDEXES.documents_type);

    // Report-Document indexes
    await db.execAsync(INDEXES.report_documents_report);
    await db.execAsync(INDEXES.report_documents_document);

    // Tag indexes
    await db.execAsync(INDEXES.tags_name);
    await db.execAsync(INDEXES.receipt_tags_receipt);
    await db.execAsync(INDEXES.receipt_tags_tag);
    await db.execAsync(INDEXES.document_tags_document);
    await db.execAsync(INDEXES.document_tags_tag);

    // Custom field indexes
    await db.execAsync(INDEXES.custom_fields_entity);
    await db.execAsync(INDEXES.receipt_custom_values_receipt);
    await db.execAsync(INDEXES.receipt_custom_values_field);
    await db.execAsync(INDEXES.document_custom_values_document);
    await db.execAsync(INDEXES.document_custom_values_field);

    // Unified items indexes
    await db.execAsync(INDEXES.items_classification);
    await db.execAsync(INDEXES.items_usage_purpose);
    await db.execAsync(INDEXES.items_date);
    await db.execAsync(INDEXES.report_items_report);
    await db.execAsync(INDEXES.report_items_item);

    console.log('Created all indexes');

    // Seed default categories
    await seedDefaultCategories(db);

    // Run data migrations
    await migrateDocumentTypes(db);

    // Run unified model migration
    console.log('Starting unified model migration...');
    const migrationResult = await migrateToUnifiedModel(db);

    if (migrationResult.success) {
      console.log('Unified model migration completed:', {
        receipts: migrationResult.receiptsCount,
        documents: migrationResult.documentsCount,
        reportLinks: migrationResult.reportLinksCount,
      });
    } else {
      console.error('Unified model migration failed:', migrationResult.errors);
    }

    dbInstance = db;
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
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
    // Custom field values first
    await db.execAsync('DROP TABLE IF EXISTS document_custom_values');
    await db.execAsync('DROP TABLE IF EXISTS receipt_custom_values');
    await db.execAsync('DROP TABLE IF EXISTS custom_fields');

    // Tag relations
    await db.execAsync('DROP TABLE IF EXISTS document_tags');
    await db.execAsync('DROP TABLE IF EXISTS receipt_tags');
    await db.execAsync('DROP TABLE IF EXISTS tags');

    // Report relations (including unified model)
    await db.execAsync('DROP TABLE IF EXISTS report_items');
    await db.execAsync('DROP TABLE IF EXISTS report_documents');
    await db.execAsync('DROP TABLE IF EXISTS report_receipts');
    await db.execAsync('DROP TABLE IF EXISTS reports');

    // Receipt items
    await db.execAsync('DROP TABLE IF EXISTS receipt_items');

    // Unified model tables
    await db.execAsync('DROP TABLE IF EXISTS items');
    await db.execAsync('DROP TABLE IF EXISTS usage_purposes');

    // Core tables
    await db.execAsync('DROP TABLE IF EXISTS receipts');
    await db.execAsync('DROP TABLE IF EXISTS documents');
    await db.execAsync('DROP TABLE IF EXISTS categories');

    console.log('All tables dropped');

    // Close and reinitialize
    await db.closeAsync();
    dbInstance = null;

    return await initDatabase();
  } catch (error) {
    console.error('Failed to reset database:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

export { DB_NAME as DATABASE_NAME };
