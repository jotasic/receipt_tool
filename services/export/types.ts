/**
 * Export Service Types
 *
 * Type definitions for monthly settlement export functionality
 */

import type { Item } from '@/types/item';

/**
 * Export configuration
 */
export interface ExportConfig {
  year: number;
  month: number;
}

/**
 * CSV row structure (Korean headers for Excel compatibility)
 */
export interface CSVRow {
  번호: number;
  날짜: string;
  상호명: string;
  금액: string;
  분류: string;
  사용목적: string;
  메모: string;
  이미지경로: string;
}

/**
 * Classification display names
 */
export const CLASSIFICATION_LABELS: Record<string, string> = {
  personal_card: '개인카드',
  corporate_card: '법인카드',
  proof_document: '증명서류',
};

/**
 * Monthly summary statistics
 */
export interface MonthlySummary {
  personalCard: {
    count: number;
    totalAmount: number;
  };
  corporateCard: {
    count: number;
    totalAmount: number;
  };
  proofDocument: {
    count: number;
    totalAmount: number;
  };
  total: {
    count: number;
    totalAmount: number;
  };
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}
