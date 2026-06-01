# Services Reference

Receipt Tool 서비스 레퍼런스

## Quick Reference

| 서비스 | 주요 함수 |
|-------|----------|
| Space Service | getAllSpaces, createSpace, updateSpace, deleteSpace, isSpaceInUse |
| Classification Service | getClassificationsBySpace, createClassification, updateClassification, deleteClassification, isClassificationInUse |
| Item Service | createItem, getItems, updateItem, deleteItem |
| Report Service | createReport, submitReport, linkItemToReport |
| OCR Service | extractReceiptData |
| Stores | useSpaceStore, useItemStore, useReportStore |

---

## 상세 문서

| 문서 | 내용 |
|-----|-----|
| [space-service.md](./services/space-service.md) | Space CRUD, 순서 변경, 사용 여부 확인 |
| [classification-service.md](./services/classification-service.md) | Classification CRUD, 공간별 조회, 순서 변경 |
| [item-service.md](./services/item-service.md) | 증빙 CRUD, 조회, 통계 (spaceId 필터 지원) |
| [report-service.md](./services/report-service.md) | 리포트 CRUD, 상태 관리, Item 연결 |
| [ocr-service.md](./services/ocr-service.md) | OCR 추출, 에러 처리, 로깅 |
| [ocr-filters.md](./services/ocr-filters.md) | OCR 텍스트 박스 필터링 |
| [stores.md](./services/stores.md) | Zustand 스토어 (spaceStore, itemStore, reportStore) |
| [types.md](./services/types.md) | TypeScript 타입 정의 |
| [database-utils.md](./services/database-utils.md) | 트랜잭션, 통계, 유지보수 |

---

## 주요 서비스 요약

### Space Service

```typescript
// 조회
getAllSpaces(): Promise<Space[]>
getSpaceById(id: string): Promise<Space | null>

// CRUD
createSpace(input: CreateSpaceInput): Promise<Space>
updateSpace(id: string, updates: UpdateSpaceInput): Promise<Space>
deleteSpace(id: string): Promise<void>

// 유틸
reorderSpaces(orderedIds: string[]): Promise<void>
isSpaceInUse(id: string): Promise<boolean>
```

상세: [space-service.md](./services/space-service.md)

### Classification Service

```typescript
// 조회
getClassificationsBySpace(spaceId: string): Promise<Classification[]>
getActiveClassificationsBySpace(spaceId: string): Promise<Classification[]>
getClassificationById(id: string): Promise<Classification | null>

// CRUD
createClassification(input: CreateClassificationInput): Promise<Classification>
updateClassification(id: string, updates: UpdateClassificationInput): Promise<Classification>
deleteClassification(id: string): Promise<void>

// 유틸
reorderClassifications(spaceId: string, orderedIds: string[]): Promise<void>
isClassificationInUse(id: string): Promise<boolean>
```

상세: [classification-service.md](./services/classification-service.md)

### Item Service

```typescript
// CRUD
createItem(input: CreateItemInput): Promise<Item>
getItems(spaceId?: string): Promise<Item[]>  // spaceId로 필터링 가능
getItemById(id: string): Promise<Item | null>
updateItem(id: string, updates: Partial<Item>): Promise<void>
deleteItem(id: string): Promise<void>

// 조회
getItemsByClassification(classification, spaceId?: string): Promise<Item[]>
getItemsByDateRange(start, end, spaceId?: string): Promise<Item[]>
searchItems(query, spaceId?: string): Promise<Item[]>
```

상세: [item-service.md](./services/item-service.md)

### Report Service

```typescript
// CRUD
createReport(input): Promise<Report>
getReports(): Promise<Report[]>
deleteReport(id): Promise<void>

// 상태 관리
submitReport(id): Promise<void>
approveReport(id): Promise<void>

// Item 연결
linkItemToReport(reportId, itemId): Promise<void>
getReportItemIds(reportId): Promise<string[]>
```

상세: [report-service.md](./services/report-service.md)

### OCR Service

```typescript
extractReceiptData(imageUri: string): Promise<ParsedReceipt>
// Returns: { storeName, amount, date, confidence, warnings }
```

상세: [ocr-service.md](./services/ocr-service.md)

---

## 에러 처리

```typescript
try {
  await createItem({...});
} catch (error) {
  // Database error handling
}

try {
  await extractReceiptData(imageUri);
} catch (error) {
  const ocrError = error as OcrError;
  // OCR error handling
}
```

상세: [database-utils.md](./services/database-utils.md)
