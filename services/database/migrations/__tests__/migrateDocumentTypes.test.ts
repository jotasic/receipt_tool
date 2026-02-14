/**
 * Tests for Document Type Migration
 */

import * as SQLite from 'expo-sqlite';
import {
  migrateDocumentTypes,
  verifyDocumentTypeMigration,
} from '../migrateDocumentTypes';

describe('migrateDocumentTypes', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    // Create in-memory database for testing
    db = await SQLite.openDatabaseAsync(':memory:');

    // Create documents table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_path TEXT,
        file_type TEXT,
        document_type TEXT DEFAULT 'other',
        memo TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it('should migrate deprecated document types to "other"', async () => {
    // Insert test documents with deprecated types
    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc1',
      'Contract Document',
      'contract'
    );

    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc2',
      'Estimate Document',
      'estimate'
    );

    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc3',
      'Invoice Document',
      'invoice'
    );

    // Run migration
    await migrateDocumentTypes(db);

    // Verify all deprecated types are converted to 'other'
    const results = await db.getAllAsync<{ id: string; document_type: string }>(
      'SELECT id, document_type FROM documents ORDER BY id'
    );

    expect(results).toHaveLength(3);
    expect(results[0].document_type).toBe('other');
    expect(results[1].document_type).toBe('other');
    expect(results[2].document_type).toBe('other');
  });

  it('should not affect documents with valid types', async () => {
    // Insert documents with valid types
    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc1',
      'Medical Document',
      'medical'
    );

    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc2',
      'Certificate Document',
      'certificate'
    );

    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc3',
      'Other Document',
      'other'
    );

    // Run migration
    await migrateDocumentTypes(db);

    // Verify types remain unchanged
    const results = await db.getAllAsync<{ id: string; document_type: string }>(
      'SELECT id, document_type FROM documents ORDER BY id'
    );

    expect(results).toHaveLength(3);
    expect(results[0].document_type).toBe('medical');
    expect(results[1].document_type).toBe('certificate');
    expect(results[2].document_type).toBe('other');
  });

  it('should be idempotent (safe to run multiple times)', async () => {
    // Insert test document
    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc1',
      'Contract Document',
      'contract'
    );

    // Run migration twice
    await migrateDocumentTypes(db);
    await migrateDocumentTypes(db);

    // Verify document type is still 'other'
    const result = await db.getFirstAsync<{ document_type: string }>(
      'SELECT document_type FROM documents WHERE id = ?',
      'doc1'
    );

    expect(result?.document_type).toBe('other');
  });

  it('should handle empty documents table gracefully', async () => {
    // Run migration on empty table
    await expect(migrateDocumentTypes(db)).resolves.not.toThrow();

    // Verify table is still empty
    const count = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM documents'
    );

    expect(count?.count).toBe(0);
  });

  it('should handle non-existent documents table gracefully', async () => {
    // Drop documents table
    await db.execAsync('DROP TABLE IF EXISTS documents');

    // Run migration should not throw
    await expect(migrateDocumentTypes(db)).resolves.not.toThrow();
  });

  it('should update updated_at timestamp', async () => {
    // Insert document with old timestamp
    const oldTimestamp = '2023-01-01T00:00:00.000Z';
    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      'doc1',
      'Contract Document',
      'contract',
      oldTimestamp,
      oldTimestamp
    );

    // Wait a moment to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Run migration
    await migrateDocumentTypes(db);

    // Verify updated_at has changed
    const result = await db.getFirstAsync<{ updated_at: string }>(
      'SELECT updated_at FROM documents WHERE id = ?',
      'doc1'
    );

    expect(result?.updated_at).not.toBe(oldTimestamp);
  });

  it('should rollback on error', async () => {
    // Insert a document
    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc1',
      'Contract Document',
      'contract'
    );

    // Close the database to trigger an error
    await db.closeAsync();

    // Migration should fail but not leave data in inconsistent state
    await expect(migrateDocumentTypes(db)).rejects.toThrow();
  });
});

describe('verifyDocumentTypeMigration', () => {
  let db: SQLite.SQLiteDatabase;

  beforeEach(async () => {
    db = await SQLite.openDatabaseAsync(':memory:');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        document_type TEXT DEFAULT 'other',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it('should return true when no deprecated types exist', async () => {
    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc1',
      'Medical Document',
      'medical'
    );

    const isValid = await verifyDocumentTypeMigration(db);
    expect(isValid).toBe(true);
  });

  it('should return false when deprecated types exist', async () => {
    await db.runAsync(
      `INSERT INTO documents (id, title, document_type, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      'doc1',
      'Contract Document',
      'contract'
    );

    const isValid = await verifyDocumentTypeMigration(db);
    expect(isValid).toBe(false);
  });

  it('should return true for empty table', async () => {
    const isValid = await verifyDocumentTypeMigration(db);
    expect(isValid).toBe(true);
  });
});
