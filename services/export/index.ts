/**
 * Export Service
 *
 * Main entry point for monthly settlement export functionality
 */

import { getItemsByDateRange } from '@/services/database/itemService';
import type { Item } from '@/types/item';
import type { ExportConfig, ExportResult, MonthlySummary } from './types';
import { itemsToCSV } from './csv';
import { collectImages } from './images';
import { createZipFile, getZipFilename } from './zip';

/**
 * Get start and end dates for a given year and month
 */
function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

  // Get last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { startDate, endDate };
}

/**
 * Calculate monthly summary statistics
 */
export function calculateMonthlySummary(items: Item[]): MonthlySummary {
  const personalCardItems = items.filter(item => item.classification === 'personal_card');
  const corporateCardItems = items.filter(item => item.classification === 'corporate_card');
  const proofDocumentItems = items.filter(item => item.classification === 'proof_document');

  const sumAmount = (items: Item[]) =>
    items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return {
    personalCard: {
      count: personalCardItems.length,
      totalAmount: sumAmount(personalCardItems),
    },
    corporateCard: {
      count: corporateCardItems.length,
      totalAmount: sumAmount(corporateCardItems),
    },
    proofDocument: {
      count: proofDocumentItems.length,
      totalAmount: sumAmount(proofDocumentItems),
    },
    total: {
      count: items.length,
      totalAmount: sumAmount(items),
    },
  };
}

/**
 * Get items for a specific month
 */
export async function getMonthlyItems(year: number, month: number, spaceId?: string): Promise<Item[]> {
  const { startDate, endDate } = getMonthDateRange(year, month);
  return await getItemsByDateRange(startDate, endDate, spaceId);
}

/**
 * Export monthly settlement as ZIP file
 *
 * Creates a ZIP file containing:
 * - 정산내역.csv (settlement CSV)
 * - images/ folder with all receipt images
 *
 * @param year - Year to export
 * @param month - Month to export (1-12)
 * @param spaceId - Optional space ID to filter items by space
 * @returns Promise<ExportResult> - Export result with file path or error
 *
 * @example
 * const result = await exportMonthlySettlement(2024, 2, spaceId);
 * if (result.success && result.filePath) {
 *   await Sharing.shareAsync(result.filePath);
 * }
 */
export async function exportMonthlySettlement(
  year: number,
  month: number,
  spaceId?: string
): Promise<ExportResult> {
  try {
    console.log(`[Export] Starting export for ${year}-${month}`);

    // 1. Get items for the month
    const items = await getMonthlyItems(year, month, spaceId);

    if (items.length === 0) {
      return {
        success: false,
        error: '선택한 월에 항목이 없습니다.',
      };
    }

    console.log(`[Export] Found ${items.length} items`);

    // 2. Generate CSV content
    const csvContent = itemsToCSV(items);
    console.log('[Export] CSV generated');

    // 3. Collect images
    const images = await collectImages(items);
    console.log(`[Export] Collected ${images.length} images`);

    // 4. Create ZIP file
    const filename = getZipFilename(year, month);
    const filePath = await createZipFile(csvContent, images, filename);

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    console.error('[Export] Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * Validate export configuration
 */
export function validateExportConfig(config: ExportConfig): boolean {
  const { year, month } = config;

  if (year < 2000 || year > 2100) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  return true;
}
