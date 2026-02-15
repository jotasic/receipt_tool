/**
 * Report Service
 *
 * Business logic layer for report operations
 */

import {
  createReport as dbCreateReport,
  linkItemToReport,
  linkReceiptToReport,
  getReports,
  getReportById,
  updateReport,
  recalculateReportTotal,
  recalculateReportTotalFromItems,
} from '@/services/database/reportService';
import type { Report, CreateReportInput } from '@/types';

/**
 * Create a new report with items (unified model)
 *
 * @param data - Report creation data
 * @returns Promise<Report> - The created report with calculated total
 */
export async function createReportWithItems(data: CreateReportInput): Promise<Report> {
  // 1. Create report in draft status with initial total of 0
  const report = await dbCreateReport({
    title: data.title,
    itemIds: data.itemIds,
    totalAmount: 0,
    status: 'draft',
  });

  // 2. Link items to report (already done in dbCreateReport)

  // 3. Recalculate total amount based on linked items
  await recalculateReportTotalFromItems(report.id);

  // 4. Fetch and return the updated report
  const updatedReport = await getReportById(report.id);
  if (!updatedReport) {
    throw new Error('Failed to retrieve created report');
  }

  return updatedReport;
}

/**
 * Create a new report with receipts (legacy - deprecated)
 *
 * @deprecated Use createReportWithItems instead. Will be removed in v2.0
 * @param data - Report creation data
 * @returns Promise<Report> - The created report with calculated total
 */
export async function createReportWithReceipts(data: {
  title: string;
  receiptIds: string[];
}): Promise<Report> {
  console.warn('[DEPRECATED] createReportWithReceipts is deprecated. Use createReportWithItems instead.');

  // 1. Create report in draft status with initial total of 0
  const report = await dbCreateReport({
    title: data.title,
    receiptIds: data.receiptIds,
    documentIds: [],
    totalAmount: 0,
    status: 'draft',
  });

  // 2. Link receipts to report (already done in dbCreateReport, but kept for explicit clarity)
  // The database service handles this, but we could add additional business logic here

  // 3. Recalculate total amount based on linked receipts
  await recalculateReportTotal(report.id);

  // 4. Fetch and return the updated report
  const updatedReport = await getReportById(report.id);
  if (!updatedReport) {
    throw new Error('Failed to retrieve created report');
  }

  return updatedReport;
}

/**
 * Submit a report (change status from draft to submitted)
 *
 * @param reportId - Report ID
 * @returns Promise<Report> - The submitted report
 */
export async function submitReport(reportId: string): Promise<Report> {
  // Update status to submitted
  await updateReport(reportId, {
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  });

  // Fetch and return the updated report
  const report = await getReportById(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  return report;
}

/**
 * Load all reports
 *
 * @returns Promise<Report[]> - Array of all reports
 */
export async function loadReports(): Promise<Report[]> {
  return await getReports();
}

/**
 * Load a single report by ID
 *
 * @param reportId - Report ID
 * @returns Promise<Report | null> - Report object or null if not found
 */
export async function loadReport(reportId: string): Promise<Report | null> {
  return await getReportById(reportId);
}

/**
 * Update report details
 *
 * @param reportId - Report ID
 * @param updates - Partial report data to update
 * @returns Promise<Report> - The updated report
 */
export async function updateReportDetails(
  reportId: string,
  updates: Partial<Omit<Report, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Report> {
  await updateReport(reportId, updates);

  // If item IDs were updated, recalculate the total (new unified model)
  if (updates.itemIds !== undefined) {
    await recalculateReportTotalFromItems(reportId);
  }

  // Legacy support: If receipt IDs were updated, recalculate the total
  if (updates.receiptIds !== undefined) {
    await recalculateReportTotal(reportId);
  }

  const report = await getReportById(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  return report;
}

/**
 * Add items to an existing report (unified model)
 *
 * @param reportId - Report ID
 * @param itemIds - Array of item IDs to add
 * @returns Promise<Report> - The updated report
 */
export async function addItemsToReport(
  reportId: string,
  itemIds: string[]
): Promise<Report> {
  // Get current report
  const report = await getReportById(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  // Link new items
  for (const itemId of itemIds) {
    await linkItemToReport(reportId, itemId);
  }

  // Recalculate total
  await recalculateReportTotalFromItems(reportId);

  // Return updated report
  const updatedReport = await getReportById(reportId);
  if (!updatedReport) {
    throw new Error('Failed to retrieve updated report');
  }

  return updatedReport;
}

/**
 * Add receipts to an existing report (legacy - deprecated)
 *
 * @deprecated Use addItemsToReport instead. Will be removed in v2.0
 * @param reportId - Report ID
 * @param receiptIds - Array of receipt IDs to add
 * @returns Promise<Report> - The updated report
 */
export async function addReceiptsToReport(
  reportId: string,
  receiptIds: string[]
): Promise<Report> {
  console.warn('[DEPRECATED] addReceiptsToReport is deprecated. Use addItemsToReport instead.');

  // Get current report
  const report = await getReportById(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  // Link new receipts
  for (const receiptId of receiptIds) {
    await linkReceiptToReport(reportId, receiptId);
  }

  // Recalculate total
  await recalculateReportTotal(reportId);

  // Return updated report
  const updatedReport = await getReportById(reportId);
  if (!updatedReport) {
    throw new Error('Failed to retrieve updated report');
  }

  return updatedReport;
}

/**
 * Calculate total amount from an array of amounts
 *
 * @param amounts - Array of numbers to sum
 * @returns number - Total sum
 */
export function calculateTotal(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Validate report data before submission
 *
 * @param report - Report to validate
 * @returns boolean - True if valid, throws error otherwise
 */
export function validateReport(report: Report): boolean {
  if (!report.title || report.title.trim().length === 0) {
    throw new Error('Report title is required');
  }

  // Check for items (new unified model) or receipts (legacy)
  const hasItems = report.itemIds && report.itemIds.length > 0;
  const hasReceipts = report.receiptIds && report.receiptIds.length > 0;

  if (!hasItems && !hasReceipts) {
    throw new Error('Report must contain at least one item');
  }

  if (report.totalAmount < 0) {
    throw new Error('Report total amount cannot be negative');
  }

  return true;
}
