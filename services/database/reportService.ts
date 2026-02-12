/**
 * Report Service
 *
 * Provides CRUD operations for expense reports
 */

import { getDatabase } from './getDatabase';
import type { ReportRow, ReportReceiptRow } from './types';
import type { Report, ReportStatus } from '@/types';

/**
 * Convert database row to Report type
 */
function rowToReport(row: ReportRow, receiptIds: string[] = []): Report {
  return {
    id: row.id,
    title: row.title,
    receiptIds,
    totalAmount: row.total_amount,
    status: row.status,
    submittedAt: row.submitted_at || undefined,
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

  // Link receipts to report
  if (report.receiptIds && report.receiptIds.length > 0) {
    for (const receiptId of report.receiptIds) {
      await linkReceiptToReport(id, receiptId);
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
    const receiptIds = await getReportReceiptIds(row.id);
    reports.push(rowToReport(row, receiptIds));
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

  const receiptIds = await getReportReceiptIds(id);
  return rowToReport(row, receiptIds);
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
  const values: any[] = [];

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

  // Update receipt associations if provided
  if (updates.receiptIds !== undefined) {
    // Remove all existing associations
    await db.runAsync('DELETE FROM report_receipts WHERE report_id = ?', [id]);

    // Add new associations
    for (const receiptId of updates.receiptIds) {
      await linkReceiptToReport(id, receiptId);
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
    const receiptIds = await getReportReceiptIds(row.id);
    reports.push(rowToReport(row, receiptIds));
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
// Report-Receipt Association Operations
// ============================================================================

/**
 * Link a receipt to a report
 *
 * @param reportId - Report ID
 * @param receiptId - Receipt ID
 * @returns Promise<void>
 */
export async function linkReceiptToReport(
  reportId: string,
  receiptId: string
): Promise<void> {
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
 * @param reportId - Report ID
 * @param receiptId - Receipt ID
 * @returns Promise<void>
 */
export async function unlinkReceiptFromReport(
  reportId: string,
  receiptId: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM report_receipts WHERE report_id = ? AND receipt_id = ?',
    [reportId, receiptId]
  );
}

/**
 * Get all receipt IDs associated with a report
 *
 * @param reportId - Report ID
 * @returns Promise<string[]> - Array of receipt IDs
 */
export async function getReportReceiptIds(reportId: string): Promise<string[]> {
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
 * @param receiptId - Receipt ID
 * @returns Promise<Report[]> - Array of reports containing the receipt
 */
export async function getReportsByReceiptId(receiptId: string): Promise<Report[]> {
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
    const receiptIds = await getReportReceiptIds(row.id);
    reports.push(rowToReport(row, receiptIds));
  }

  return reports;
}

/**
 * Calculate and update the total amount for a report based on linked receipts
 *
 * @param reportId - Report ID
 * @returns Promise<number> - Updated total amount
 */
export async function recalculateReportTotal(reportId: string): Promise<number> {
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
