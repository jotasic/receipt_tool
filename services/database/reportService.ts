/**
 * Report Service
 *
 * Provides CRUD operations for expense reports
 *
 * @note Data Migration TODO
 * If upgrading from a legacy version with existing data:
 * 1. Copy data from report_receipts to report_items (receipt_id → item_id)
 * 2. Copy data from report_documents to report_items (document_id → item_id)
 * 3. After verification, optionally drop report_receipts and report_documents tables
 * 4. Update all client code to use itemIds instead of receiptIds/documentIds
 *
 * Current state: Both legacy and unified models are supported for backward compatibility.
 */

import { getDatabase } from './getDatabase';
import type { ReportRow, ReportReceiptRow, ReportDocumentRow } from './types';
import type { ReportItemRow, ItemRow } from './schema';
import type { Report, ReportStatus } from '@/types';
import type { Item } from '@/types/item';

/**
 * Convert database ItemRow to Item type
 */
function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    title: row.title,
    classification: row.classification,
    usagePurpose: row.usage_purpose,
    amount: row.amount ?? undefined,
    date: row.date,
    storeName: row.store_name ?? undefined,
    filePath: row.file_path ?? undefined,
    fileType: row.file_type ?? undefined,
    ocrText: row.ocr_text ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to Report type
 */
function rowToReport(
  row: ReportRow,
  itemIds: string[] = [],
  receiptIds: string[] = [],
  documentIds: string[] = [],
  items?: Item[]
): Report {
  const report: Report = {
    id: row.id,
    title: row.title,
    itemIds,
    totalAmount: row.total_amount,
    status: row.status,
    submittedAt: row.submitted_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Legacy fields for backward compatibility
  if (receiptIds.length > 0) {
    report.receiptIds = receiptIds;
  }
  if (documentIds.length > 0) {
    report.documentIds = documentIds;
  }

  // Add items if provided (new unified model)
  if (items !== undefined) {
    report.items = items;
  }

  return report;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Create a new report
 *
 * @param report - Report data without id, createdAt, updatedAt
 * @returns Promise<Report> - The created report with generated fields
 */
export async function createReport(
  report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Report> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  // Insert report
  await db.runAsync(
    `
    INSERT INTO reports (id, title, total_amount, status, submitted_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      report.title,
      report.totalAmount,
      report.status,
      report.submittedAt || null,
      now,
      now,
    ]
  );

  // Link items to report (new unified model)
  if (report.itemIds && report.itemIds.length > 0) {
    for (const itemId of report.itemIds) {
      await linkItemToReport(id, itemId);
    }
  }

  // Legacy support: Link receipts to report
  if (report.receiptIds && report.receiptIds.length > 0) {
    for (const receiptId of report.receiptIds) {
      await linkReceiptToReport(id, receiptId);
    }
  }

  // Legacy support: Link documents to report
  if (report.documentIds && report.documentIds.length > 0) {
    for (const documentId of report.documentIds) {
      await linkDocumentToReport(id, documentId);
    }
  }

  return {
    ...report,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get all reports
 *
 * @returns Promise<Report[]> - Array of all reports ordered by creation date
 */
export async function getReports(): Promise<Report[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportRow>(
    'SELECT * FROM reports ORDER BY created_at DESC'
  );

  const reports: Report[] = [];
  for (const row of rows) {
    const itemIds = await getReportItemIds(row.id);
    const receiptIds = await getReportReceiptIds(row.id);
    const documentIds = await getReportDocumentIds(row.id);
    reports.push(rowToReport(row, itemIds, receiptIds, documentIds));
  }

  return reports;
}

/**
 * Get a report by ID
 *
 * @param id - Report ID
 * @returns Promise<Report | null> - Report object or null if not found
 */
export async function getReportById(id: string): Promise<Report | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReportRow>(
    'SELECT * FROM reports WHERE id = ?',
    [id]
  );

  if (!row) {
    return null;
  }

  const itemIds = await getReportItemIds(id);
  const receiptIds = await getReportReceiptIds(id);
  const documentIds = await getReportDocumentIds(id);

  // Get items (new unified model)
  const items = await getReportItems(id);

  return rowToReport(row, itemIds, receiptIds, documentIds, items);
}

/**
 * Update a report
 *
 * @param id - Report ID
 * @param updates - Partial report data to update
 * @returns Promise<void>
 */
export async function updateReport(
  id: string,
  updates: Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Build dynamic UPDATE query based on provided fields
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.totalAmount !== undefined) {
    fields.push('total_amount = ?');
    values.push(updates.totalAmount);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);

    // Update submitted_at when status changes to 'submitted'
    if (updates.status === 'submitted' && updates.submittedAt === undefined) {
      fields.push('submitted_at = ?');
      values.push(now);
    }
  }
  if (updates.submittedAt !== undefined) {
    fields.push('submitted_at = ?');
    values.push(updates.submittedAt);
  }

  // Always update updated_at
  fields.push('updated_at = ?');
  values.push(now);

  // Add id for WHERE clause
  values.push(id);

  if (fields.length > 0) {
    const query = `UPDATE reports SET ${fields.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }

  // Update item associations if provided (new unified model)
  if (updates.itemIds !== undefined) {
    // Remove all existing associations
    await db.runAsync('DELETE FROM report_items WHERE report_id = ?', [id]);

    // Add new associations
    for (const itemId of updates.itemIds) {
      await linkItemToReport(id, itemId);
    }
  }

  // Legacy support: Update receipt associations if provided
  if (updates.receiptIds !== undefined) {
    // Remove all existing associations
    await db.runAsync('DELETE FROM report_receipts WHERE report_id = ?', [id]);

    // Add new associations
    for (const receiptId of updates.receiptIds) {
      await linkReceiptToReport(id, receiptId);
    }
  }

  // Legacy support: Update document associations if provided
  if (updates.documentIds !== undefined) {
    // Remove all existing associations
    await db.runAsync('DELETE FROM report_documents WHERE report_id = ?', [id]);

    // Add new associations
    for (const documentId of updates.documentIds) {
      await linkDocumentToReport(id, documentId);
    }
  }
}

/**
 * Delete a report
 *
 * @param id - Report ID
 * @returns Promise<void>
 */
export async function deleteReport(id: string): Promise<void> {
  const db = await getDatabase();

  // Foreign key cascade will automatically delete report_receipts
  await db.runAsync('DELETE FROM reports WHERE id = ?', [id]);
}

/**
 * Get reports by status
 *
 * @param status - Report status
 * @returns Promise<Report[]> - Array of reports with the given status
 */
export async function getReportsByStatus(status: ReportStatus): Promise<Report[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportRow>(
    'SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC',
    [status]
  );

  const reports: Report[] = [];
  for (const row of rows) {
    const itemIds = await getReportItemIds(row.id);
    const receiptIds = await getReportReceiptIds(row.id);
    const documentIds = await getReportDocumentIds(row.id);
    reports.push(rowToReport(row, itemIds, receiptIds, documentIds));
  }

  return reports;
}

/**
 * Submit a report (change status from draft to submitted)
 *
 * @param id - Report ID
 * @returns Promise<void>
 */
export async function submitReport(id: string): Promise<void> {
  await updateReport(id, {
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  });
}

/**
 * Approve a report
 *
 * @param id - Report ID
 * @returns Promise<void>
 */
export async function approveReport(id: string): Promise<void> {
  await updateReport(id, {
    status: 'approved',
  });
}

/**
 * Reject a report
 *
 * @param id - Report ID
 * @returns Promise<void>
 */
export async function rejectReport(id: string): Promise<void> {
  await updateReport(id, {
    status: 'rejected',
  });
}

/**
 * Revert a report back to draft status
 *
 * @param id - Report ID
 * @returns Promise<void>
 */
export async function revertReportToDraft(id: string): Promise<void> {
  await updateReport(id, {
    status: 'draft',
    submittedAt: undefined,
  });
}

// ============================================================================
// Report-Item Association Operations (Unified Model)
// ============================================================================

/**
 * Link an item to a report
 *
 * @param reportId - Report ID
 * @param itemId - Item ID
 * @returns Promise<void>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function linkItemToReport(
  reportId: string,
  itemId: string
): Promise<void> {
  try {
    const db = await getDatabase();

    // Use INSERT OR IGNORE to avoid duplicate entries
    await db.runAsync(
      `
      INSERT OR IGNORE INTO report_items (report_id, item_id)
      VALUES (?, ?)
    `,
      [reportId, itemId]
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to link item to report: ${errorMessage}`);
  }
}

/**
 * Unlink an item from a report
 *
 * @param reportId - Report ID
 * @param itemId - Item ID
 * @returns Promise<void>
 * @throws Error with [Database] prefix if database operation fails
 */
export async function unlinkItemFromReport(
  reportId: string,
  itemId: string
): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM report_items WHERE report_id = ? AND item_id = ?',
      [reportId, itemId]
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to unlink item from report: ${errorMessage}`);
  }
}

/**
 * Get all item IDs linked to a report
 *
 * @param reportId - Report ID
 * @returns Promise<string[]> - Array of item IDs
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getReportItemIds(reportId: string): Promise<string[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ReportItemRow>(
      'SELECT item_id FROM report_items WHERE report_id = ?',
      [reportId]
    );

    return rows.map((row) => row.item_id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get report item IDs: ${errorMessage}`);
  }
}

/**
 * Get all items linked to a report (with full Item data)
 *
 * @param reportId - Report ID
 * @returns Promise<Item[]> - Array of items linked to the report
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getReportItems(reportId: string): Promise<Item[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ItemRow>(
      `
      SELECT i.* FROM items i
      INNER JOIN report_items ri ON i.id = ri.item_id
      WHERE ri.report_id = ?
      ORDER BY i.date DESC
    `,
      [reportId]
    );

    return rows.map(rowToItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get report items: ${errorMessage}`);
  }
}

/**
 * Get all reports that contain a specific item
 *
 * @param itemId - Item ID
 * @returns Promise<Report[]> - Array of reports containing the item
 * @throws Error with [Database] prefix if database operation fails
 */
export async function getReportsByItemId(itemId: string): Promise<Report[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ReportRow>(
      `
      SELECT r.* FROM reports r
      INNER JOIN report_items ri ON r.id = ri.report_id
      WHERE ri.item_id = ?
      ORDER BY r.created_at DESC
    `,
      [itemId]
    );

    const reports: Report[] = [];
    for (const row of rows) {
      const itemIds = await getReportItemIds(row.id);
      const receiptIds = await getReportReceiptIds(row.id);
      const documentIds = await getReportDocumentIds(row.id);
      const items = await getReportItems(row.id);
      reports.push(rowToReport(row, itemIds, receiptIds, documentIds, items));
    }

    return reports;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to get reports by item ID: ${errorMessage}`);
  }
}

/**
 * Calculate and update the total amount for a report based on linked items
 *
 * This replaces recalculateReportTotal for the unified model.
 * Only counts items with amount values (excludes proof documents without amounts).
 *
 * @param reportId - Report ID
 * @returns Promise<number> - Updated total amount
 * @throws Error with [Database] prefix if database operation fails
 */
export async function recalculateReportTotalFromItems(reportId: string): Promise<number> {
  try {
    const db = await getDatabase();

    // Sum all item amounts for this report
    const result = await db.getFirstAsync<{ total: number | null }>(
      `
      SELECT SUM(i.amount) as total
      FROM items i
      INNER JOIN report_items ri ON i.id = ri.item_id
      WHERE ri.report_id = ? AND i.amount IS NOT NULL
    `,
      [reportId]
    );

    const totalAmount = result?.total ?? 0;

    // Update the report with the calculated total
    await updateReport(reportId, { totalAmount });

    return totalAmount;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`[Database] Failed to recalculate report total from items: ${errorMessage}`);
  }
}

// ============================================================================
// Report-Receipt Association Operations (Legacy - Deprecated)
// ============================================================================

/**
 * Link a receipt to a report
 *
 * @deprecated Use linkItemToReport instead. Will be removed in v2.0
 * @param reportId - Report ID
 * @param receiptId - Receipt ID
 * @returns Promise<void>
 */
export async function linkReceiptToReport(
  reportId: string,
  receiptId: string
): Promise<void> {
  console.warn('[DEPRECATED] linkReceiptToReport is deprecated. Use linkItemToReport instead.');
  const db = await getDatabase();

  // Use INSERT OR IGNORE to avoid duplicate entries
  await db.runAsync(
    `
    INSERT OR IGNORE INTO report_receipts (report_id, receipt_id)
    VALUES (?, ?)
  `,
    [reportId, receiptId]
  );
}

/**
 * Unlink a receipt from a report
 *
 * @deprecated Use unlinkItemFromReport instead. Will be removed in v2.0
 * @param reportId - Report ID
 * @param receiptId - Receipt ID
 * @returns Promise<void>
 */
export async function unlinkReceiptFromReport(
  reportId: string,
  receiptId: string
): Promise<void> {
  console.warn('[DEPRECATED] unlinkReceiptFromReport is deprecated. Use unlinkItemFromReport instead.');
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM report_receipts WHERE report_id = ? AND receipt_id = ?',
    [reportId, receiptId]
  );
}

/**
 * Get all receipt IDs associated with a report
 *
 * @deprecated Use getReportItemIds instead. Will be removed in v2.0
 * @param reportId - Report ID
 * @returns Promise<string[]> - Array of receipt IDs
 */
export async function getReportReceiptIds(reportId: string): Promise<string[]> {
  console.warn('[DEPRECATED] getReportReceiptIds is deprecated. Use getReportItemIds instead.');
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportReceiptRow>(
    'SELECT receipt_id FROM report_receipts WHERE report_id = ?',
    [reportId]
  );

  return rows.map((row) => row.receipt_id);
}

/**
 * Get all reports that contain a specific receipt
 *
 * @deprecated Use getReportsByItemId instead. Will be removed in v2.0
 * @param receiptId - Receipt ID
 * @returns Promise<Report[]> - Array of reports containing the receipt
 */
export async function getReportsByReceiptId(receiptId: string): Promise<Report[]> {
  console.warn('[DEPRECATED] getReportsByReceiptId is deprecated. Use getReportsByItemId instead.');
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportRow>(
    `
    SELECT r.* FROM reports r
    INNER JOIN report_receipts rr ON r.id = rr.report_id
    WHERE rr.receipt_id = ?
    ORDER BY r.created_at DESC
  `,
    [receiptId]
  );

  const reports: Report[] = [];
  for (const row of rows) {
    const itemIds = await getReportItemIds(row.id);
    const receiptIds = await getReportReceiptIds(row.id);
    const documentIds = await getReportDocumentIds(row.id);
    const items = await getReportItems(row.id);
    reports.push(rowToReport(row, itemIds, receiptIds, documentIds, items));
  }

  return reports;
}

/**
 * Calculate and update the total amount for a report based on linked receipts
 *
 * @deprecated Use recalculateReportTotalFromItems instead. Will be removed in v2.0
 * @param reportId - Report ID
 * @returns Promise<number> - Updated total amount
 */
export async function recalculateReportTotal(reportId: string): Promise<number> {
  console.warn('[DEPRECATED] recalculateReportTotal is deprecated. Use recalculateReportTotalFromItems instead.');
  const db = await getDatabase();

  // Sum all receipt amounts for this report
  const result = await db.getFirstAsync<{ total: number | null }>(
    `
    SELECT SUM(r.amount) as total
    FROM receipts r
    INNER JOIN report_receipts rr ON r.id = rr.receipt_id
    WHERE rr.report_id = ?
  `,
    [reportId]
  );

  const totalAmount = result?.total ?? 0;

  // Update the report with the calculated total
  await updateReport(reportId, { totalAmount });

  return totalAmount;
}

/**
 * Get report statistics
 *
 * @returns Promise<object> - Statistics including counts by status
 */
export async function getReportStatistics(): Promise<{
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
}> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
  }>(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM reports
  `);

  return result || { total: 0, draft: 0, submitted: 0, approved: 0, rejected: 0 };
}

// ============================================================================
// Report-Document Association Operations (Legacy - Deprecated)
// ============================================================================

/**
 * Link a document to a report
 *
 * @deprecated Use linkItemToReport instead. Will be removed in v2.0
 * @param reportId - Report ID
 * @param documentId - Document ID
 * @returns Promise<void>
 */
export async function linkDocumentToReport(
  reportId: string,
  documentId: string
): Promise<void> {
  console.warn('[DEPRECATED] linkDocumentToReport is deprecated. Use linkItemToReport instead.');
  const db = await getDatabase();

  // Use INSERT OR IGNORE to avoid duplicate entries
  await db.runAsync(
    `
    INSERT OR IGNORE INTO report_documents (report_id, document_id)
    VALUES (?, ?)
  `,
    [reportId, documentId]
  );
}

/**
 * Unlink a document from a report
 *
 * @deprecated Use unlinkItemFromReport instead. Will be removed in v2.0
 * @param reportId - Report ID
 * @param documentId - Document ID
 * @returns Promise<void>
 */
export async function unlinkDocumentFromReport(
  reportId: string,
  documentId: string
): Promise<void> {
  console.warn('[DEPRECATED] unlinkDocumentFromReport is deprecated. Use unlinkItemFromReport instead.');
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM report_documents WHERE report_id = ? AND document_id = ?',
    [reportId, documentId]
  );
}

/**
 * Get all document IDs associated with a report
 *
 * @deprecated Use getReportItemIds instead. Will be removed in v2.0
 * @param reportId - Report ID
 * @returns Promise<string[]> - Array of document IDs
 */
export async function getReportDocumentIds(reportId: string): Promise<string[]> {
  console.warn('[DEPRECATED] getReportDocumentIds is deprecated. Use getReportItemIds instead.');
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportDocumentRow>(
    'SELECT document_id FROM report_documents WHERE report_id = ?',
    [reportId]
  );

  return rows.map((row) => row.document_id);
}

/**
 * Get all reports that contain a specific document
 *
 * @deprecated Use getReportsByItemId instead. Will be removed in v2.0
 * @param documentId - Document ID
 * @returns Promise<Report[]> - Array of reports containing the document
 */
export async function getReportsByDocumentId(documentId: string): Promise<Report[]> {
  console.warn('[DEPRECATED] getReportsByDocumentId is deprecated. Use getReportsByItemId instead.');
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportRow>(
    `
    SELECT r.* FROM reports r
    INNER JOIN report_documents rd ON r.id = rd.report_id
    WHERE rd.document_id = ?
    ORDER BY r.created_at DESC
  `,
    [documentId]
  );

  const reports: Report[] = [];
  for (const row of rows) {
    const itemIds = await getReportItemIds(row.id);
    const receiptIds = await getReportReceiptIds(row.id);
    const documentIds = await getReportDocumentIds(row.id);
    const items = await getReportItems(row.id);
    reports.push(rowToReport(row, itemIds, receiptIds, documentIds, items));
  }

  return reports;
}
