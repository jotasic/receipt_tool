# Report Service API

경비 청구 리포트 API

## CRUD Operations

### createReport

```typescript
createReport(input: CreateReportInput): Promise<Report>
```

리포트 생성

**Parameters:**
- `input.title`: `string` (필수)
- `input.status`: `'draft' | 'submitted' | 'approved' | 'rejected'` (기본: 'draft')
- `input.totalAmount`: `number` (기본: 0)

### getReports

```typescript
getReports(): Promise<Report[]>
```

전체 리포트 조회 (최신순)

### getReportById

```typescript
getReportById(id: string): Promise<Report | null>
```

ID로 리포트 조회

### updateReport

```typescript
updateReport(id: string, updates: Partial<Report>): Promise<void>
```

리포트 수정

### deleteReport

```typescript
deleteReport(id: string): Promise<void>
```

리포트 삭제

---

## Status Management

### submitReport

```typescript
submitReport(id: string): Promise<void>
```

리포트 제출 (draft → submitted)

### approveReport

```typescript
approveReport(id: string): Promise<void>
```

리포트 승인 (submitted → approved)

### rejectReport

```typescript
rejectReport(id: string): Promise<void>
```

리포트 거절 (submitted → rejected)

### revertReportToDraft

```typescript
revertReportToDraft(id: string): Promise<void>
```

임시저장으로 되돌리기 (any → draft)

### getReportsByStatus

```typescript
getReportsByStatus(status: ReportStatus): Promise<Report[]>
```

상태별 리포트 조회

---

## Item Linking

### linkItemToReport

```typescript
linkItemToReport(reportId: string, itemId: string): Promise<void>
```

Item을 Report에 연결

### unlinkItemFromReport

```typescript
unlinkItemFromReport(reportId: string, itemId: string): Promise<void>
```

Item과 Report 연결 해제

### getReportItemIds

```typescript
getReportItemIds(reportId: string): Promise<string[]>
```

리포트에 연결된 Item ID 목록

### getReportsByItemId

```typescript
getReportsByItemId(itemId: string): Promise<Report[]>
```

특정 Item이 포함된 리포트 조회

### recalculateReportTotal

```typescript
recalculateReportTotal(reportId: string): Promise<number>
```

리포트 총액 재계산

---

## Statistics

### getReportStatistics

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
