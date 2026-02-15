# Item Service API

증빙(Item) 관련 데이터베이스 API

## CRUD Operations

### createItem

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

### getItems

```typescript
getItems(): Promise<Item[]>
```

전체 증빙 조회 (최신순 정렬)

### getItemById

```typescript
getItemById(id: string): Promise<Item | null>
```

ID로 증빙 조회

### updateItem

```typescript
updateItem(id: string, updates: Partial<Item>): Promise<void>
```

증빙 수정

**Example:**
```typescript
await updateItem(itemId, {
  amount: 15000,
  title: '점심 식사 (수정)',
});
```

### deleteItem

```typescript
deleteItem(id: string): Promise<void>
```

증빙 삭제

---

## Query Operations

### getItemsByClassification

```typescript
getItemsByClassification(
  classification: ItemClassification
): Promise<Item[]>
```

분류별 증빙 조회

### getItemsByUsagePurpose

```typescript
getItemsByUsagePurpose(purpose: string): Promise<Item[]>
```

사용 용도별 증빙 조회

### getItemsByDateRange

```typescript
getItemsByDateRange(
  startDate: string,
  endDate: string
): Promise<Item[]>
```

날짜 범위로 증빙 조회

### searchItems

```typescript
searchItems(query: string): Promise<Item[]>
```

제목/상점명으로 증빙 검색

---

## Statistics

### getItemStatisticsByClassification

```typescript
getItemStatisticsByClassification(): Promise<{
  classification: string;
  count: number;
  totalAmount: number;
}[]>
```

분류별 통계 조회

### getItemStatisticsByUsagePurpose

```typescript
getItemStatisticsByUsagePurpose(): Promise<{
  usagePurpose: string;
  count: number;
  totalAmount: number;
}[]>
```

용도별 통계 조회

### getMonthlyItemStatistics

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
