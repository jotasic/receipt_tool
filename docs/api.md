# API Reference

Receipt Tool 서비스 API 레퍼런스

## Database Services

### Item Service

증빙(Item) 관련 API

#### createItem

```typescript
createItem(input: CreateItemInput): Promise<Item>
```

새 증빙 생성

**Parameters:**
- `input.classification`: `'personal_card' | 'corporate_card' | 'proof_document'`
- `input.usagePurpose`: `string` (예: 'meal', 'other')
- `input.title`: `string` (필수)
- `input.amount`: `number` (선택)
- `input.date`: `string` (ISO date, 필수)
- `input.storeName`: `string` (선택)
- `input.description`: `string` (선택)
- `input.imagePath`: `string` (선택)
- `input.ocrText`: `string` (선택)

**Returns:** 생성된 Item 객체

**Example:**
```typescript
const item = await createItem({
  classification: 'personal_card',
  usagePurpose: 'meal',
  title: '점심 식사',
  amount: 12000,
  date: '2024-02-15',
  storeName: '한식당',
});
```

#### getItems

```typescript
getItems(): Promise<Item[]>
```

전체 증빙 조회

**Returns:** Item 배열 (최신순 정렬)

#### getItemById

```typescript
getItemById(id: string): Promise<Item | null>
```

ID로 증빙 조회

**Parameters:**
- `id`: Item ID

**Returns:** Item 또는 null

#### updateItem

```typescript
updateItem(id: string, updates: Partial<Item>): Promise<void>
```

증빙 수정

**Parameters:**
- `id`: Item ID
- `updates`: 수정할 필드들

**Example:**
```typescript
await updateItem(itemId, {
  amount: 15000,
  title: '점심 식사 (수정)',
});
```

#### deleteItem

```typescript
deleteItem(id: string): Promise<void>
```

증빙 삭제

**Parameters:**
- `id`: Item ID

#### getItemsByClassification

```typescript
getItemsByClassification(
  classification: ItemClassification
): Promise<Item[]>
```

분류별 증빙 조회

**Parameters:**
- `classification`: `'personal_card' | 'corporate_card' | 'proof_document'`

#### getItemsByUsagePurpose

```typescript
getItemsByUsagePurpose(purpose: string): Promise<Item[]>
```

사용 용도별 증빙 조회

**Parameters:**
- `purpose`: 용도 (예: 'meal', 'other')

#### getItemsByDateRange

```typescript
getItemsByDateRange(
  startDate: string,
  endDate: string
): Promise<Item[]>
```

날짜 범위로 증빙 조회

**Parameters:**
- `startDate`: 시작 날짜 (ISO date)
- `endDate`: 종료 날짜 (ISO date)

#### searchItems

```typescript
searchItems(query: string): Promise<Item[]>
```

제목/상점명으로 증빙 검색

**Parameters:**
- `query`: 검색어

#### getItemStatisticsByClassification

```typescript
getItemStatisticsByClassification(): Promise<{
  classification: string;
  count: number;
  totalAmount: number;
}[]>
```

분류별 통계 조회

#### getItemStatisticsByUsagePurpose

```typescript
getItemStatisticsByUsagePurpose(): Promise<{
  usagePurpose: string;
  count: number;
  totalAmount: number;
}[]>
```

용도별 통계 조회

#### getMonthlyItemStatistics

```typescript
getMonthlyItemStatistics(
  year: number,
  month: number
): Promise<{
  count: number;
  totalAmount: number;
}>
```

월별 통계 조회

**Parameters:**
- `year`: 연도
- `month`: 월 (1-12)

---

### Report Service

경비 청구 리포트 API

#### createReport

```typescript
createReport(input: CreateReportInput): Promise<Report>
```

리포트 생성

**Parameters:**
- `input.title`: `string` (필수)
- `input.status`: `'draft' | 'submitted' | 'approved' | 'rejected'` (기본: 'draft')
- `input.totalAmount`: `number` (기본: 0)

**Returns:** 생성된 Report 객체

#### getReports

```typescript
getReports(): Promise<Report[]>
```

전체 리포트 조회

**Returns:** Report 배열 (최신순)

#### getReportById

```typescript
getReportById(id: string): Promise<Report | null>
```

ID로 리포트 조회

#### updateReport

```typescript
updateReport(id: string, updates: Partial<Report>): Promise<void>
```

리포트 수정

#### deleteReport

```typescript
deleteReport(id: string): Promise<void>
```

리포트 삭제

#### submitReport

```typescript
submitReport(id: string): Promise<void>
```

리포트 제출 (draft → submitted)

#### approveReport

```typescript
approveReport(id: string): Promise<void>
```

리포트 승인 (submitted → approved)

#### rejectReport

```typescript
rejectReport(id: string): Promise<void>
```

리포트 거절 (submitted → rejected)

#### revertReportToDraft

```typescript
revertReportToDraft(id: string): Promise<void>
```

임시저장으로 되돌리기 (any → draft)

#### getReportsByStatus

```typescript
getReportsByStatus(status: ReportStatus): Promise<Report[]>
```

상태별 리포트 조회

#### linkItemToReport

```typescript
linkItemToReport(reportId: string, itemId: string): Promise<void>
```

Item을 Report에 연결

#### unlinkItemFromReport

```typescript
unlinkItemFromReport(reportId: string, itemId: string): Promise<void>
```

Item과 Report 연결 해제

#### getReportItemIds

```typescript
getReportItemIds(reportId: string): Promise<string[]>
```

리포트에 연결된 Item ID 목록

#### getReportsByItemId

```typescript
getReportsByItemId(itemId: string): Promise<Report[]>
```

특정 Item이 포함된 리포트 조회

#### recalculateReportTotal

```typescript
recalculateReportTotal(reportId: string): Promise<number>
```

리포트 총액 재계산

**Returns:** 계산된 총액

#### getReportStatistics

```typescript
getReportStatistics(): Promise<{
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
}>
```

리포트 통계 조회

---

### Utility Functions

#### executeTransaction

```typescript
executeTransaction(callback: () => Promise<void>): Promise<void>
```

트랜잭션 실행

**Example:**
```typescript
await executeTransaction(async () => {
  await createItem({...});
  await linkItemToReport(reportId, itemId);
  // 모두 성공하거나 모두 롤백
});
```

#### getDatabaseStatistics

```typescript
getDatabaseStatistics(): Promise<{
  items: number;
  reports: number;
  categories: number;
  databaseSize: number;
}>
```

데이터베이스 통계

#### vacuumDatabase

```typescript
vacuumDatabase(): Promise<void>
```

데이터베이스 공간 최적화

#### checkDatabaseIntegrity

```typescript
checkDatabaseIntegrity(): Promise<boolean>
```

데이터베이스 무결성 검사

#### resetDatabase

```typescript
resetDatabase(): Promise<void>
```

데이터베이스 초기화 (모든 데이터 삭제)

---

## OCR Service

### extractReceiptData

```typescript
extractReceiptData(imageUri: string): Promise<ParsedReceipt>
```

이미지에서 영수증 데이터 추출

**Parameters:**
- `imageUri`: 이미지 파일 경로 (file:// URI)

**Returns:** ParsedReceipt
- `storeName`: `string | undefined` - 상점명
- `amount`: `number | undefined` - 금액
- `date`: `string | undefined` - 날짜 (ISO format)
- `confidence`: `number` - 신뢰도 (0-1)
- `warnings`: `string[]` - 경고 메시지

**Throws:** OcrError
- `type`: OcrErrorType
- `userMessage`: 사용자용 메시지
- `retryable`: 재시도 가능 여부
- `suggestedAction`: 권장 조치

**Example:**
```typescript
try {
  const result = await extractReceiptData(imageUri);
  console.log('금액:', result.amount);
  console.log('신뢰도:', result.confidence);
} catch (error) {
  const ocrError = error as OcrError;
  console.error(ocrError.userMessage);
}
```

### OcrErrorType

```typescript
enum OcrErrorType {
  IMAGE_ACCESS_ERROR = 'IMAGE_ACCESS_ERROR',
  ML_KIT_INIT_ERROR = 'ML_KIT_INIT_ERROR',
  NO_TEXT_DETECTED = 'NO_TEXT_DETECTED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  POOR_IMAGE_QUALITY = 'POOR_IMAGE_QUALITY',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### ocrLogger

```typescript
ocrLogger.info(message: string, context?: any): void
ocrLogger.warn(message: string, context?: any): void
ocrLogger.error(message: string, error?: Error, context?: any): void
ocrLogger.debug(message: string, context?: any): void

ocrLogger.getRecentLogs(limit?: number): OcrLogEntry[]
ocrLogger.getErrorLogs(): OcrLogEntry[]
ocrLogger.exportLogs(): string
```

### Debug Functions

```typescript
printOcrDebugInfo(): void
getOcrStatistics(): OcrStatistics
getOcrDebugInfo(): OcrDebugInfo
exportOcrLogs(): Promise<string>
clearOcrLogs(): void
```

---

## Store (Zustand)

### useItemStore

```typescript
interface ItemStore {
  items: Item[];
  loading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItem: (input: CreateItemInput) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  getItemsByClassification: (classification: ItemClassification) => Item[];
  getItemsByUsagePurpose: (purpose: UsagePurpose) => Item[];
  getItemsByDateRange: (start: string, end: string) => Item[];
}
```

**Example:**
```typescript
import { useItemStore } from '@/store/itemStore';

function MyComponent() {
  const { items, fetchItems, addItem } = useItemStore();

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    await addItem({
      classification: 'personal_card',
      usagePurpose: 'meal',
      title: '점심',
      amount: 10000,
      date: '2024-02-15',
    });
  };
}
```

### useReportStore

```typescript
interface ReportStore {
  reports: Report[];
  loading: boolean;
  error: string | null;

  fetchReports: () => Promise<void>;
  createReport: (input: CreateReportInput) => Promise<Report>;
  submitReport: (id: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;

  getReportsByStatus: (status: ReportStatus) => Report[];
}
```

---

## Types

### Item

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

### Report

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

---

## Error Handling

모든 데이터베이스 작업은 에러를 throw할 수 있습니다:

```typescript
try {
  await createItem({...});
} catch (error) {
  console.error('Database error:', error);
  // 사용자에게 에러 표시
}
```

OCR 작업은 OcrError를 throw합니다:

```typescript
try {
  await extractReceiptData(imageUri);
} catch (error) {
  const ocrError = error as OcrError;
  if (ocrError.retryable) {
    // 재시도 옵션 제공
  } else {
    // 수동 입력 안내
  }
}
```
