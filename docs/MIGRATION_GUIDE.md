# Migration Guide: Receipt → Document → Item

Receipt Tool의 데이터 모델 진화 과정

## 개요

Receipt Tool은 다음과 같은 모델 진화를 거쳤습니다:

```
Phase 1: Receipt (영수증 전용)
   ↓
Phase 2: Receipt + Document (분리 모델)
   ↓
Phase 3: Item (통합 모델) ← 현재
```

이 가이드는 각 단계의 변화와 마이그레이션 방법을 설명합니다.

## Phase 1: Receipt (영수증 전용)

### 모델

```typescript
interface Receipt {
  id: string;
  title: string;
  storeName: string;
  amount: number;
  date: string;
  category: string;        // 'food' | 'transport' | ...
  imagePath?: string;
  ocrText?: string;
  items?: ReceiptItem[];   // 영수증 항목
}
```

### 한계

- 영수증만 관리 가능
- 의료비 세부내역서, 진단서 등 문서 타입 지원 불가
- 회사 제출용 증빙 문서 관리 어려움

## Phase 2: Receipt + Document (분리 모델)

### Receipt 모델

```typescript
interface Receipt {
  id: string;
  title: string;
  storeName: string;
  amount: number;
  date: string;
  category: string;
  imagePath?: string;
  ocrText?: string;
  items?: ReceiptItem[];
}
```

### Document 모델 (새로 추가)

```typescript
interface Document {
  id: string;
  title: string;
  documentType: DocumentType;  // 'medical' | 'contract' | 'estimate' | 'invoice' | 'certificate' | 'other'
  filePath: string;
  date?: string;
  description?: string;
  relatedReceiptId?: string;   // Receipt와 연결
}
```

### 문제점

1. **중복 코드**: Receipt과 Document를 위한 중복된 CRUD 코드
2. **복잡한 관리**: 두 개의 별도 테이블, Store, 서비스 레이어
3. **리포트 복잡도**: Report가 Receipt과 Document를 별도로 관리
   ```typescript
   interface Report {
     receiptIds: string[];
     documentIds: string[];  // 별도 관리
   }
   ```
4. **UI 복잡도**: 두 가지 타입을 각각 처리하는 UI 필요

### 제거된 Document Types

Phase 2에서 지원했던 일부 document type이 제거됨:
- `contract` (계약서) → `other`로 마이그레이션
- `estimate` (견적서) → `other`로 마이그레이션
- `invoice` (청구서) → `other`로 마이그레이션

이유: HR/재무 증빙에 집중하기 위해 단순화

## Phase 3: Item (통합 모델) ← 현재

### 통합 개념

Receipt와 Document를 하나의 **Item**으로 통합하고, 2차원 분류 체계 도입:

```
Item = ItemClassification × UsagePurpose
```

### Item 모델

```typescript
interface Item {
  id: string;

  // 2차원 분류
  classification: ItemClassification;  // 증빙 형태
  usagePurpose: UsagePurpose;         // 사용 용도

  // 공통 필드
  title: string;
  description?: string;
  amount?: number;                     // proof_document는 금액 없을 수 있음
  date: string;
  storeName?: string;

  // 파일
  imagePath?: string;
  ocrText?: string;

  // 메타데이터
  createdAt: string;
  updatedAt: string;
}
```

### ItemClassification (증빙 형태)

```typescript
type ItemClassification =
  | 'personal_card'    // 개인카드 (나중에 청구)
  | 'corporate_card'   // 법인카드 (회사 카드로 직접 결제)
  | 'proof_document'   // 기타 증빙 문서
```

**매핑:**
- 구 Receipt → `personal_card` 또는 `corporate_card`
- 구 Document → `proof_document`

### UsagePurpose (사용 용도)

```typescript
type UsagePurpose = 'meal' | 'other' | ...  // 동적 확장 가능
```

**매핑:**
- 구 Receipt.category → `usagePurpose`
- 구 Document.documentType → 무시 (classification이 `proof_document`이면 충분)

### Report 단순화

```typescript
interface Report {
  id: string;
  title: string;
  totalAmount: number;
  status: ReportStatus;
  // items는 report_items 테이블에서 관리 (receiptIds/documentIds 제거)
}
```

## 마이그레이션 전략

### 데이터베이스 마이그레이션

#### 1. 레거시 테이블 유지

```sql
-- 레거시 테이블 (읽기 전용)
receipts
documents
categories
report_receipts
report_documents
```

#### 2. 새 테이블 생성

```sql
-- 통합 증빙 테이블
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  classification TEXT NOT NULL CHECK (classification IN ('personal_card', 'corporate_card', 'proof_document')),
  usage_purpose TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL,
  date TEXT NOT NULL,
  store_name TEXT,
  image_path TEXT,
  ocr_text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 사용 용도 관리
CREATE TABLE usage_purposes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

-- 리포트-아이템 연결
CREATE TABLE report_items (
  report_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  PRIMARY KEY (report_id, item_id),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
```

#### 3. 데이터 마이그레이션 스크립트

```typescript
async function migrateToUnifiedModel(db: SQLiteDatabase) {
  await db.execAsync('BEGIN TRANSACTION');

  try {
    // Receipt → Item (personal_card)
    await db.execAsync(`
      INSERT INTO items (
        id, classification, usage_purpose, title, amount, date,
        store_name, image_path, ocr_text, created_at, updated_at
      )
      SELECT
        id,
        'personal_card' as classification,
        category_id as usage_purpose,
        title,
        amount,
        date,
        store_name,
        image_path,
        ocr_text,
        created_at,
        updated_at
      FROM receipts
    `);

    // Document → Item (proof_document)
    await db.execAsync(`
      INSERT INTO items (
        id, classification, usage_purpose, title, description, date,
        image_path, created_at, updated_at
      )
      SELECT
        id,
        'proof_document' as classification,
        'other' as usage_purpose,
        title,
        description,
        date,
        file_path as image_path,
        created_at,
        updated_at
      FROM documents
    `);

    // Report-Receipt → Report-Item
    await db.execAsync(`
      INSERT INTO report_items (report_id, item_id)
      SELECT report_id, receipt_id as item_id
      FROM report_receipts
    `);

    // Report-Document → Report-Item
    await db.execAsync(`
      INSERT INTO report_items (report_id, item_id)
      SELECT report_id, document_id as item_id
      FROM report_documents
    `);

    await db.execAsync('COMMIT');
    console.log('✅ 마이그레이션 완료');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

### 코드 마이그레이션

#### Before: Phase 2

```typescript
// Receipt 생성
await createReceipt({
  title: '점심',
  storeName: '한식당',
  amount: 12000,
  date: '2024-02-15',
  category: 'food',
});

// Document 생성
await createDocument({
  title: '진단서',
  documentType: 'medical',
  filePath: '/path/to/file',
  date: '2024-02-15',
});

// Report 생성
await createReport({
  title: '2월 경비',
  receiptIds: ['r1', 'r2'],
  documentIds: ['d1'],
  totalAmount: 0,
  status: 'draft',
});
```

#### After: Phase 3

```typescript
// Item 생성 (개인카드 - 식비)
await createItem({
  classification: 'personal_card',
  usagePurpose: 'meal',
  title: '점심',
  storeName: '한식당',
  amount: 12000,
  date: '2024-02-15',
});

// Item 생성 (증빙 문서)
await createItem({
  classification: 'proof_document',
  usagePurpose: 'other',
  title: '진단서',
  imagePath: '/path/to/file',
  date: '2024-02-15',
});

// Report 생성 (단순화)
const report = await createReport({
  title: '2월 경비',
  status: 'draft',
  totalAmount: 0,
});

// Item 연결
await linkItemToReport(report.id, item1.id);
await linkItemToReport(report.id, item2.id);
```

### Store 마이그레이션

#### Before: Phase 2

```typescript
// 두 개의 별도 Store
useReceiptStore();
useDocumentStore();
```

#### After: Phase 3

```typescript
// 하나의 통합 Store
useItemStore();

// 필터링으로 분류
const personalCards = useItemStore(state =>
  state.items.filter(i => i.classification === 'personal_card')
);

const documents = useItemStore(state =>
  state.items.filter(i => i.classification === 'proof_document')
);
```

### UI 마이그레이션

#### Before: Phase 2

```typescript
// 별도의 화면과 컴포넌트
/app/receipt/add.tsx
/app/receipt/[id].tsx
/app/document/add.tsx
/app/document/[id].tsx

<ReceiptCard />
<DocumentCard />
```

#### After: Phase 3

```typescript
// 통합 화면과 컴포넌트
/app/item/add.tsx
/app/item/[id].tsx

<ItemCard item={item} />  // classification에 따라 다르게 렌더링
```

## 이점

### 1. 코드 단순화

- **통합 CRUD**: 하나의 서비스 레이어
- **통합 Store**: 하나의 상태 관리
- **통합 UI**: 재사용 가능한 컴포넌트

### 2. 유연성

- **동적 분류**: `classification`과 `usagePurpose` 조합으로 확장 가능
- **새 용도 추가**: `usage_purposes` 테이블에 추가만 하면 됨
- **복합 필터링**: 두 차원으로 필터링 가능

### 3. 리포트 관리 단순화

```typescript
// Before
report.receiptIds + report.documentIds

// After
report_items 테이블로 통합 관리
```

### 4. 검색/통계 단순화

```typescript
// Before
const receipts = await searchReceipts(query);
const documents = await searchDocuments(query);
const combined = [...receipts, ...documents];

// After
const items = await searchItems(query);
```

## 현재 상태

### 완료
- ✅ 데이터베이스 스키마 통합 (items 테이블)
- ✅ itemService 구현
- ✅ itemStore 구현
- ✅ Item 기본 UI (ItemCard, ItemForm)
- ✅ 마이그레이션 스크립트

### 진행 중
- ⚠️ Report UI를 Item 기반으로 전환
- ⚠️ 레거시 Store 제거 (receiptStore, documentStore)

### 미구현
- ❌ UsagePurpose 동적 관리 서비스
- ❌ UsagePurpose 관리 UI

## 호환성

### 레거시 데이터 접근

레거시 테이블은 읽기 전용으로 유지됩니다:

```typescript
// 레거시 Receipt 조회 (deprecated)
const receipts = await getReceipts();

// 신규 Item 조회 (권장)
const items = await getItems();
```

### 점진적 마이그레이션

앱이 실행될 때 자동으로 마이그레이션됩니다:

```typescript
// services/database/init.ts
await migrateToUnifiedModel(db);
```

기존 데이터는 items 테이블로 복사되며, 레거시 테이블은 유지됩니다.

## 다음 단계

1. **Report UI 전환** - `/app/report/create.tsx`를 Item 기반으로 수정
2. **레거시 Store 제거** - receiptStore, documentStore 삭제
3. **UsagePurpose 서비스 구현** - 동적 용도 관리
4. **레거시 테이블 제거 검토** - 마이그레이션 안정화 후

## Category System Migration

### Before (Legacy)

```typescript
import { getCategories } from '@/services/database/categoryService';

// Get all categories
const categories = await getCategories();
// Categories: 식비, 교통비, 쇼핑, etc.

// Receipt used category_id field
const receipt = {
  title: '점심',
  amount: 12000,
  category: 'food',  // Category ID
  // ... other fields
};
```

### After (Current)

```typescript
import { getActiveUsagePurposes } from '@/services/database/usagePurposeService';

// Get all usage purposes
const purposes = await getActiveUsagePurposes();
// Purposes: meal, other, + user-defined

// Items now use 2D classification:
const item = {
  classification: 'personal_card',  // or 'corporate_card', 'proof_document'
  usagePurpose: 'meal',             // or 'other', or user-defined ID
  title: '점심',
  amount: 12000,
  // ... other fields
};
```

### Rationale

**Why we moved away from Categories:**

1. **Single-dimension limitation**: Categories were only about expense type (food, transport, etc.)
2. **Missing payment context**: Couldn't distinguish between personal card, corporate card, or proof documents
3. **Not extensible**: Hard to add new categorization dimensions

**Benefits of 2D Classification:**

1. **Payment method dimension**: `classification` tells you HOW the expense was paid
   - `personal_card` - Personal card (to be reimbursed)
   - `corporate_card` - Corporate card (already paid by company)
   - `proof_document` - Supporting documents (no payment involved)

2. **Usage purpose dimension**: `usagePurpose` tells you WHAT the expense was for
   - System defaults: `meal`, `other`
   - User-extensible via `usage_purposes` table
   - Same flexibility as old categories, but cleaner

3. **More accurate tracking**: Can now answer questions like:
   - "Show me all corporate card meal expenses"
   - "What personal card expenses need reimbursement?"
   - "List all proof documents for medical purposes"

### Migration Path

Legacy `categories` table and `category_id` field are kept for backward compatibility:

- Old `receipts` table still references categories
- New `items` table uses `usage_purpose` instead
- Both systems coexist - no data loss
- Category service still works but is marked `@deprecated`

When creating new items, always use `usagePurpose` instead of categories.

## 참고 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 현재 아키텍처
- [API.md](./API.md) - Item API 레퍼런스
- `/services/database/migrations/` - 마이그레이션 스크립트
