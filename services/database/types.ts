/**
 * Database Row Types
 *
 * TypeScript interfaces for database row structures
 * These match the SQLite schema but use snake_case as stored in DB
 */

import type { ReportStatus } from '@/types/report';

/**
 * Database row type for categories table
 */
export interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

/**
 * Database row type for receipts table
 */
export interface ReceiptRow {
  id: string;
  title: string;
  store_name: string | null;
  amount: number;
  date: string;
  category_id: string | null;
  image_path: string | null;
  ocr_text: string | null;
  receipt_type: 'corporate' | 'personal';
  memo: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for receipt_items table
 */
export interface ReceiptItemRow {
  id: string;
  receipt_id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Database row type for reports table
 */
export interface ReportRow {
  id: string;
  title: string;
  total_amount: number;
  status: ReportStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for report_receipts junction table
 */
export interface ReportReceiptRow {
  report_id: string;
  receipt_id: string;
}

/**
 * Extended receipt row with category information
 */
export interface ReceiptWithCategoryRow extends ReceiptRow {
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

/**
 * Receipt row with all related data (items and category)
 */
export interface ReceiptFullRow extends ReceiptWithCategoryRow {
  items?: ReceiptItemRow[];
}

/**
 * Report row with receipt IDs
 */
export interface ReportWithReceiptsRow extends ReportRow {
  receipt_ids?: string[];
}

/**
 * Database row type for documents table
 */
export interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  file_type: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}
