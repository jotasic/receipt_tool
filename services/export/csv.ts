/**
 * CSV Export Utilities
 *
 * Converts Item[] to CSV string with Korean headers and UTF-8 BOM for Excel compatibility
 */

import type { Item } from '@/types/item';
import type { CSVRow } from './types';
import { CLASSIFICATION_LABELS } from './types';

/**
 * Convert Item to CSVRow
 */
function itemToCSVRow(item: Item, index: number, imageFilename: string): CSVRow {
  return {
    번호: index + 1,
    날짜: item.date,
    상호명: item.storeName || '-',
    금액: item.amount ? item.amount.toLocaleString('ko-KR') : '-',
    분류: CLASSIFICATION_LABELS[item.classification] || item.classification,
    사용목적: item.usagePurpose || '-',
    메모: item.memo || '',
    이미지경로: imageFilename,
  };
}

/**
 * Generate safe filename from item data
 * Removes special characters to ensure file system compatibility
 */
export function generateImageFilename(item: Item, index: number): string {
  if (!item.filePath) {
    return '';
  }

  // Get file extension from original path
  const ext = item.filePath.split('.').pop() || 'jpg';

  // Generate safe filename: 001_스타벅스_20240215.jpg
  const num = String(index + 1).padStart(3, '0');
  const storeName = (item.storeName || '알수없음')
    .replace(/[\/\\:*?"<>|]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .substring(0, 20); // Limit length
  const dateStr = item.date.replace(/-/g, '');

  return `${num}_${storeName}_${dateStr}.${ext}`;
}

/**
 * Convert items to CSV string
 * Includes UTF-8 BOM for Excel compatibility
 */
export function itemsToCSV(items: Item[]): string {
  // Define headers
  const headers: (keyof CSVRow)[] = [
    '번호',
    '날짜',
    '상호명',
    '금액',
    '분류',
    '사용목적',
    '메모',
    '이미지경로',
  ];

  // Build CSV rows
  const rows: CSVRow[] = items.map((item, index) => {
    const imageFilename = item.filePath
      ? `images/${generateImageFilename(item, index)}`
      : '';
    return itemToCSVRow(item, index, imageFilename);
  });

  // Convert to CSV string
  const headerLine = headers.join(',');
  const dataLines = rows.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape values containing commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  return BOM + [headerLine, ...dataLines].join('\n');
}

/**
 * Get CSV filename for a given year and month
 */
export function getCSVFilename(year: number, month: number): string {
  return `정산내역.csv`;
}
