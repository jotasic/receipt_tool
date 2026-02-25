/**
 * Document Service
 *
 * Provides CRUD operations for documents (non-receipt company documents)
 */

import { getDatabase } from './getDatabase';
import type { DocumentRow } from './types';
import type { Document, CreateDocumentInput, UpdateDocumentInput, DocumentType } from '@/types';

/**
 * Convert database row to Document type
 */
function rowToDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    filePath: row.file_path || undefined,
    fileType: row.file_type || undefined,
    documentType: (row.document_type as DocumentType) || undefined,
    memo: row.memo || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Create a new document
 *
 * @param input - Document data
 * @returns Promise<Document> - The created document
 */
export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `
    INSERT INTO documents (id, title, description, file_path, file_type, document_type, memo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      input.title,
      input.description || null,
      input.filePath || null,
      input.fileType || null,
      input.documentType || 'other',
      input.memo || null,
      now,
      now,
    ]
  );

  return {
    id,
    title: input.title,
    description: input.description,
    filePath: input.filePath,
    fileType: input.fileType,
    documentType: input.documentType,
    memo: input.memo,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get all documents
 *
 * @returns Promise<Document[]> - Array of all documents ordered by date
 */
export async function getDocuments(): Promise<Document[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DocumentRow>(
    'SELECT * FROM documents ORDER BY created_at DESC'
  );

  return rows.map(rowToDocument);
}

/**
 * Get a document by ID
 *
 * @param id - Document ID
 * @returns Promise<Document | null> - Document object or null if not found
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DocumentRow>(
    'SELECT * FROM documents WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  return rowToDocument(row);
}

/**
 * Update a document
 *
 * @param id - Document ID
 * @param updates - Partial document data to update
 * @returns Promise<void>
 */
export async function updateDocument(
  id: string,
  updates: UpdateDocumentInput
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.filePath !== undefined) {
    fields.push('file_path = ?');
    values.push(updates.filePath);
  }
  if (updates.fileType !== undefined) {
    fields.push('file_type = ?');
    values.push(updates.fileType);
  }
  if (updates.documentType !== undefined) {
    fields.push('document_type = ?');
    values.push(updates.documentType);
  }
  if (updates.memo !== undefined) {
    fields.push('memo = ?');
    values.push(updates.memo);
  }

  // Always update updated_at
  fields.push('updated_at = ?');
  values.push(now);

  // Add id for WHERE clause
  values.push(id);

  if (fields.length > 0) {
    const query = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }
}

/**
 * Delete a document
 *
 * @param id - Document ID
 * @returns Promise<void>
 */
export async function deleteDocument(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
}

/**
 * Search documents by title or description
 *
 * @param query - Search query
 * @returns Promise<Document[]> - Array of matching documents
 */
export async function searchDocuments(query: string): Promise<Document[]> {
  const db = await getDatabase();
  const searchPattern = `%${query}%`;
  const rows = await db.getAllAsync<DocumentRow>(
    'SELECT * FROM documents WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC',
    [searchPattern, searchPattern]
  );

  return rows.map(rowToDocument);
}

/**
 * Get documents by document type
 *
 * @param documentType - Document type to filter by
 * @returns Promise<Document[]> - Array of documents of the specified type
 */
export async function getDocumentsByType(documentType: DocumentType): Promise<Document[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DocumentRow>(
    'SELECT * FROM documents WHERE document_type = ? ORDER BY created_at DESC',
    [documentType]
  );

  return rows.map(rowToDocument);
}
