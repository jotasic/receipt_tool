# TypeScript Types

주요 타입 정의

## Item

```typescript
interface Item {
  id: string;
  classification: ItemClassification;
  usagePurpose: UsagePurpose;
  title: string;
  description?: string;
  amount?: number;
  date: string;
  storeName?: string;
  imagePath?: string;
  ocrText?: string;
  createdAt: string;
  updatedAt: string;
}

type ItemClassification = 'personal_card' | 'corporate_card' | 'proof_document';
type UsagePurpose = 'meal' | 'other';
```

## Report

```typescript
interface Report {
  id: string;
  title: string;
  totalAmount: number;
  status: ReportStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
```

## Input Types

### CreateItemInput

```typescript
interface CreateItemInput {
  classification: ItemClassification;
  usagePurpose: UsagePurpose;
  title: string;
  description?: string;
  amount?: number;
  date: string;
  storeName?: string;
  imagePath?: string;
  ocrText?: string;
}
```

### CreateReportInput

```typescript
interface CreateReportInput {
  title: string;
  status?: ReportStatus;
  totalAmount?: number;
}
```

## Tag

```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}
```

## CustomField

```typescript
interface CustomFieldDefinition {
  id: string;
  name: string;
  fieldType: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  isRequired: boolean;
  displayOrder: number;
}

interface CustomFieldValue {
  itemId: string;
  fieldId: string;
  value: string;
}
```

## OCR

```typescript
interface ParsedReceipt {
  storeName?: string;
  amount?: number;
  date?: string;
  confidence: number;
  warnings: string[];
}

interface OcrError {
  type: OcrErrorType;
  userMessage: string;
  retryable: boolean;
  suggestedAction: string;
}
```
