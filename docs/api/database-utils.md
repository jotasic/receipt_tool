# Database Utility Functions

데이터베이스 유틸리티 API

## Transaction

### executeTransaction

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

---

## Statistics

### getDatabaseStatistics

```typescript
getDatabaseStatistics(): Promise<{
  items: number;
  reports: number;
  categories: number;
  databaseSize: number;
}>
```

데이터베이스 통계

---

## Maintenance

### vacuumDatabase

```typescript
vacuumDatabase(): Promise<void>
```

데이터베이스 공간 최적화

### checkDatabaseIntegrity

```typescript
checkDatabaseIntegrity(): Promise<boolean>
```

데이터베이스 무결성 검사

### resetDatabase

```typescript
resetDatabase(): Promise<void>
```

데이터베이스 초기화 (모든 데이터 삭제)

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
