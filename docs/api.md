# API Reference

Receipt Tool 서비스 API 레퍼런스

## Quick Reference

| 서비스 | 주요 함수 |
|-------|----------|
| Item Service | createItem, getItems, updateItem, deleteItem |
| Report Service | createReport, submitReport, linkItemToReport |
| OCR Service | extractReceiptData |
| Stores | useItemStore, useReportStore |

---

## 상세 문서

| 문서 | 내용 |
|-----|-----|
| [item-service.md](./api/item-service.md) | 증빙 CRUD, 조회, 통계 API |
| [report-service.md](./api/report-service.md) | 리포트 CRUD, 상태 관리, Item 연결 API |
| [ocr-service.md](./api/ocr-service.md) | OCR 추출, 에러 처리, 로깅 API |
| [stores.md](./api/stores.md) | Zustand 스토어 (itemStore, reportStore) |
| [types.md](./api/types.md) | TypeScript 타입 정의 |
| [database-utils.md](./api/database-utils.md) | 트랜잭션, 통계, 유지보수 |

---

## 주요 API 요약

### Item Service

```typescript
// CRUD
createItem(input: CreateItemInput): Promise<Item>
getItems(): Promise<Item[]>
getItemById(id: string): Promise<Item | null>
updateItem(id: string, updates: Partial<Item>): Promise<void>
deleteItem(id: string): Promise<void>

// 조회
getItemsByClassification(classification): Promise<Item[]>
getItemsByDateRange(start, end): Promise<Item[]>
searchItems(query): Promise<Item[]>
```

상세: [item-service.md](./api/item-service.md)

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

상세: [report-service.md](./api/report-service.md)

### OCR Service

```typescript
extractReceiptData(imageUri: string): Promise<ParsedReceipt>
// Returns: { storeName, amount, date, confidence, warnings }
```

상세: [ocr-service.md](./api/ocr-service.md)

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

상세: [database-utils.md](./api/database-utils.md)
