import type { Item } from './item';

export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Report {
  id: string;
  title: string;
  totalAmount: number;
  status: ReportStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;

  // New unified field
  itemIds?: string[];

  // Legacy fields (deprecated, kept for backward compatibility)
  /** @deprecated Use itemIds instead */
  receiptIds?: string[];
  /** @deprecated Use itemIds instead */
  documentIds?: string[];

  // Optional: Full Item objects loaded via JOIN
  items?: Item[];
}

/**
 * Input type for creating a new report
 */
export interface CreateReportInput {
  title: string;
  itemIds: string[];
}

/**
 * Input type for updating a report
 */
export interface UpdateReportInput {
  title?: string;
  itemIds?: string[];
  status?: ReportStatus;
  submittedAt?: string;
}
