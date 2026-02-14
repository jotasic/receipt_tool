import type { Item } from './item';

export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Report {
  id: string;
  title: string;
  receiptIds: string[];
  documentIds: string[];
  totalAmount: number;
  status: ReportStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  // New unified model field
  items?: Item[];
}
