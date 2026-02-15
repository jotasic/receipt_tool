/**
 * Document Type Definition
 *
 * Represents company documents for submission (non-receipt documents)
 */

/**
 * Document type classification for HR/financial proof documents
 *
 * This enum covers document types used for employee verification,
 * medical reimbursement, and other proof documentation purposes.
 */
export type DocumentType =
  /**
   * Medical documents (의료)
   * - Medical receipts (의료비 영수증)
   * - Diagnosis certificates (진단서)
   * - Detailed medical statements (세부내역서)
   * - Hospital visit records
   * Used for medical expense reimbursement and insurance claims
   */
  | 'medical'

  /**
   * Verification certificates (증명서)
   * - Employment certificates (재직증명서)
   * - Income certificates (소득증명서)
   * - Residence certificates (주민등록등본)
   * - Educational certificates (학력증명서)
   * Used for HR verification and administrative purposes
   */
  | 'certificate'

  /**
   * Other miscellaneous documents (기타)
   * - Any proof documents not covered by specific categories
   * - Supplementary documentation for submissions
   */
  | 'other';

export interface Document {
  id: string;
  title: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  documentType?: DocumentType;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  documentType?: DocumentType;
  memo?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  documentType?: DocumentType;
  memo?: string;
}
