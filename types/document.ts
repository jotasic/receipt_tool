/**
 * Document Type Definition
 *
 * Represents company documents for submission (non-receipt documents)
 */

export interface Document {
  id: string;
  title: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  memo?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  memo?: string;
}
