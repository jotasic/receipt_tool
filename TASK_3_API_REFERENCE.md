# Task 3 API Reference

## Document Type Operations

### DocumentType
```typescript
type DocumentType = 'medical' | 'contract' | 'estimate' | 'invoice' | 'certificate' | 'other';
```

### getDocumentsByType
Get all documents of a specific type.

```typescript
function getDocumentsByType(documentType: DocumentType): Promise<Document[]>
```

**Parameters:**
- `documentType`: The type of documents to retrieve

**Returns:** Array of documents matching the specified type, ordered by creation date (newest first)

**Example:**
```typescript
const medicalDocs = await getDocumentsByType('medical');
// Returns all documents with documentType === 'medical'
```

---

## Report-Document Linking Operations

### linkDocumentToReport
Link a document to a report.

```typescript
function linkDocumentToReport(reportId: string, documentId: string): Promise<void>
```

**Parameters:**
- `reportId`: ID of the report
- `documentId`: ID of the document to link

**Example:**
```typescript
await linkDocumentToReport('report123', 'doc456');
```

**Notes:**
- Uses `INSERT OR IGNORE` to prevent duplicate entries
- Does not throw error if already linked

---

### unlinkDocumentFromReport
Remove a document from a report.

```typescript
function unlinkDocumentFromReport(reportId: string, documentId: string): Promise<void>
```

**Parameters:**
- `reportId`: ID of the report
- `documentId`: ID of the document to unlink

**Example:**
```typescript
await unlinkDocumentFromReport('report123', 'doc456');
```

---

### getReportDocumentIds
Get all document IDs associated with a report.

```typescript
function getReportDocumentIds(reportId: string): Promise<string[]>
```

**Parameters:**
- `reportId`: ID of the report

**Returns:** Array of document IDs

**Example:**
```typescript
const documentIds = await getReportDocumentIds('report123');
// Returns ['doc1', 'doc2', 'doc3']
```

---

### getReportsByDocumentId
Get all reports that contain a specific document.

```typescript
function getReportsByDocumentId(documentId: string): Promise<Report[]>
```

**Parameters:**
- `documentId`: ID of the document

**Returns:** Array of reports containing the document, ordered by creation date (newest first)

**Example:**
```typescript
const reports = await getReportsByDocumentId('doc456');
// Returns all reports that include this document
```

---

## Updated Interfaces

### Report Interface
```typescript
interface Report {
  id: string;
  title: string;
  receiptIds: string[];
  documentIds: string[];      // ← NEW
  totalAmount: number;
  status: ReportStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Document Interface
```typescript
interface Document {
  id: string;
  title: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  documentType?: DocumentType;  // ← NOW SUPPORTED
  memo?: string;
  createdAt: string;
  updatedAt: string;
}
```

### CreateDocumentInput
```typescript
interface CreateDocumentInput {
  title: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  documentType?: DocumentType;  // ← NOW SUPPORTED
  memo?: string;
}
```

### UpdateDocumentInput
```typescript
interface UpdateDocumentInput {
  title?: string;
  description?: string;
  filePath?: string;
  fileType?: string;
  documentType?: DocumentType;  // ← NOW SUPPORTED
  memo?: string;
}
```

---

## Usage Patterns

### Pattern 1: Create Document with Type
```typescript
const document = await createDocument({
  title: '진단서',
  documentType: 'medical',
  description: '병원 진료 진단서',
  filePath: '/documents/medical.pdf',
});
```

### Pattern 2: Create Report with Documents
```typescript
const report = await createReport({
  title: '2024년 2월 출장비',
  receiptIds: ['receipt1', 'receipt2'],
  documentIds: ['doc1', 'doc2'],
  totalAmount: 0,
  status: 'draft',
});
```

### Pattern 3: Add Document to Existing Report
```typescript
// Get current report
const report = await getReportById('report123');

// Link new document
await linkDocumentToReport(report.id, 'newDoc456');

// Get updated report
const updatedReport = await getReportById('report123');
console.log(updatedReport.documentIds); // Includes 'newDoc456'
```

### Pattern 4: Query Documents by Type
```typescript
const medicalDocs = await getDocumentsByType('medical');
const contracts = await getDocumentsByType('contract');
const invoices = await getDocumentsByType('invoice');
```

### Pattern 5: Update Report Documents
```typescript
await updateReport('report123', {
  documentIds: ['doc1', 'doc2', 'doc3'], // Replaces all documents
});
```

---

## Database Tables

### documents
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_type TEXT,
  document_type TEXT DEFAULT 'other',  -- NEW
  memo TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

### report_documents (junction table)
```sql
CREATE TABLE report_documents (
  report_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  PRIMARY KEY (report_id, document_id),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
)
```

---

## Import Paths

```typescript
// All functions available from main index
import {
  createDocument,
  getDocumentsByType,
  linkDocumentToReport,
  unlinkDocumentFromReport,
  getReportDocumentIds,
  getReportsByDocumentId,
} from '@/services/database';

// Or from specific services
import { getDocumentsByType } from '@/services/database/documentService';
import { 
  linkDocumentToReport,
  unlinkDocumentFromReport,
} from '@/services/database/reportService';

// Types
import type { DocumentType } from '@/types';
```
