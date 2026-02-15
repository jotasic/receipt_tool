# Data Flow

데이터 흐름 및 아키텍처 패턴

## 레이어 구조

```
┌─────────────────────────────────────┐
│           UI (app/, components/)    │
├─────────────────────────────────────┤
│           Store (Zustand)           │
├─────────────────────────────────────┤
│           Services                  │
├─────────────────────────────────────┤
│           SQLite (expo-sqlite)      │
└─────────────────────────────────────┘
```

---

## 증빙 추가 플로우

```
1. 사용자가 카메라로 증빙 촬영
   ↓
2. /app/item/add.tsx 화면 이동
   ↓
3. OCR 서비스로 이미지 텍스트 추출
   - expo-ocr 사용 (ML Kit)
   - 실패 시 수동 입력
   ↓
4. ItemForm에서 정보 확인/수정
   - classification 선택 (personal_card/corporate_card/proof_document)
   - usagePurpose 선택 (meal/other/...)
   - 금액, 날짜, 제목 등 입력
   ↓
5. itemService.createItem() 호출
   ↓
6. SQLite items 테이블에 저장
   ↓
7. itemStore 상태 업데이트
   ↓
8. 목록 화면으로 이동 (/items)
```

---

## 리포트 생성 플로우

```
1. 사용자가 리포트 생성 시작
   ↓
2. /app/report/create.tsx 화면
   ↓
3. items 목록에서 포함할 증빙 선택
   ↓
4. reportService.createReport() 호출
   - Item들 연결 (report_items 테이블)
   - totalAmount 자동 계산
   ↓
5. SQLite에 저장
   ↓
6. reportStore 상태 업데이트
   ↓
7. 리포트 상세 화면 이동 (/report/[id])
```

---

## 상태 관리 패턴

### itemStore

```typescript
interface ItemStore {
  items: Item[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: CreateItemInput) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // Filters
  getItemsByClassification: (classification: ItemClassification) => Item[];
  getItemsByUsagePurpose: (purpose: UsagePurpose) => Item[];
  getItemsByDateRange: (start: string, end: string) => Item[];
}
```

### reportStore

```typescript
interface ReportStore {
  reports: Report[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchReports: () => Promise<void>;
  createReport: (input: CreateReportInput) => Promise<Report>;
  submitReport: (id: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;

  // Filters
  getReportsByStatus: (status: ReportStatus) => Report[];
}
```

---

## 데이터 동기화

- **로컬 우선**: 모든 데이터는 SQLite에 저장
- **Store는 캐시**: DB에서 로드 후 메모리에 캐시
- **변경 시 양방향 업데이트**: DB 저장 → Store 업데이트
