# Database Service Guide

SQLite 데이터베이스 서비스 사용 가이드

## 목차

- [개요](#개요)
- [Quick Start](#quick-start)
- [데이터 모델](#데이터-모델)
- [서비스 API](#서비스-api)
- [고급 기능](#고급-기능)
- [React Native 통합](#react-native-통합)
- [데이터베이스 관리](#데이터베이스-관리)

## 개요

Receipt Tool은 expo-sqlite를 사용하여 로컬에 데이터를 저장합니다.

### 주요 기능

- **Item CRUD**: 증빙 생성, 조회, 수정, 삭제
- **Report 관리**: 경비 청구 리포트 생성 및 관리
- **검색/필터**: 날짜, 분류, 용도별 조회
- **통계**: 지출 통계, 카테고리별 집계
- **트랜잭션**: 원자적 다중 작업
- **데이터 무결성**: Foreign key, CASCADE delete

### 기술 스택

- **expo-sqlite**: ~16.0.10
- **TypeScript**: 완전한 타입 안전성
- **서비스 레이어**: 49개 함수 제공

## Quick Start

### 1. 데이터베이스 초기화

앱 시작 시 모듈 레벨에서 DB 초기화 Promise를 먼저 실행한 후, React 상태와 연결합니다:

```typescript
import { useEffect, useState } from 'react';
import { initDatabase } from '@/services/database';

// 모듈 로드 시 1회만 실행 (React 생명주기와 무관)
const DB_READY_PROMISE = initDatabase();

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  // DB_READY_PROMISE 결과를 React 상태로 연결
  useEffect(() => {
    let isMounted = true;
    DB_READY_PROMISE
      .then(() => {
        if (isMounted) setDbReady(true);
      })
      .catch((err) => {
        if (isMounted) setDbError(err instanceof Error ? err : new Error('Unknown error'));
      });
    return () => { isMounted = false; };
  }, []);

  if (dbError) {
    return <ErrorScreen error={dbError} />;
  }

  if (!dbReady) {
    return <LoadingScreen />;
  }

  return <MainApp />;
}
```

**주요 개선:**
- 모듈 로드 시 Promise 즉시 시작 (React 생명주기와 무관)
- React StrictMode 언마운트 시에도 DB 초기화 계속 진행
- `isMounted` 체크로 언마운트 상태 추적

### 2. Item 기본 작업

```typescript
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from '@/services/database';

// 생성
const item = await createItem({
  classification: 'personal_card',
  usagePurpose: 'meal',
  title: '점심 식사',
  amount: 12000,
  date: '2024-02-15',
  storeName: '한식당',
});

// 전체 조회
const allItems = await getItems();

// ID로 조회
const oneItem = await getItemById(item.id);

// 수정
await updateItem(item.id, {
  amount: 15000,
  title: '점심 식사 (수정)',
});

// 삭제
await deleteItem(item.id);
```

### 3. Report 기본 작업

```typescript
import {
  createReport,
  linkItemToReport,
  recalculateReportTotal,
  submitReport,
} from '@/services/database';

// 리포트 생성
const report = await createReport({
  title: '2월 경비 청구',
  status: 'draft',
  totalAmount: 0,
});

// Item 연결
await linkItemToReport(report.id, item1.id);
await linkItemToReport(report.id, item2.id);

// 총액 재계산
const total = await recalculateReportTotal(report.id);

// 제출
await submitReport(report.id);
```

## 데이터 모델

### Item (통합 증빙)

```typescript
interface Item {
  id: string;
  classification: 'personal_card' | 'corporate_card' | 'proof_document';
  usagePurpose: string;  // 'meal' | 'other' | ...
  title: string;
  description?: string;
  amount?: number;
  date: string;          // ISO date string (YYYY-MM-DD)
  storeName?: string;
  imagePath?: string;
  ocrText?: string;
  createdAt: string;     // ISO datetime
  updatedAt: string;     // ISO datetime
}
```

### Report (경비 청구)

```typescript
interface Report {
  id: string;
  title: string;
  totalAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;  // ISO datetime
  createdAt: string;
  updatedAt: string;
}
```

### UsagePurpose (사용 용도)

```typescript
interface UsagePurpose {
  id: string;
  name: string;          // 한글명 (예: 식비)
  nameEn?: string;       // 영문명 (예: meal)
  icon?: string;
  color?: string;
  isActive: boolean;
  displayOrder: number;
}
```

## 서비스 API

### Item Service (12개 함수)

#### 기본 CRUD

```typescript
// 생성
createItem(input: CreateItemInput): Promise<Item>

// 조회
getItems(): Promise<Item[]>
getItemById(id: string): Promise<Item | null>

// 수정
updateItem(id: string, updates: Partial<Item>): Promise<void>

// 삭제
deleteItem(id: string): Promise<void>
```

#### 필터링

```typescript
// 분류별 조회
getItemsByClassification(
  classification: ItemClassification
): Promise<Item[]>

// 용도별 조회
getItemsByUsagePurpose(purpose: string): Promise<Item[]>

// 날짜 범위 조회
getItemsByDateRange(
  startDate: string,
  endDate: string
): Promise<Item[]>

// 검색 (제목, 상점명)
searchItems(query: string): Promise<Item[]>
```

#### 통계

```typescript
// 분류별 통계
getItemStatisticsByClassification(): Promise<{
  classification: string;
  count: number;
  totalAmount: number;
}[]>

// 용도별 통계
getItemStatisticsByUsagePurpose(): Promise<{
  usagePurpose: string;
  count: number;
  totalAmount: number;
}[]>

// 월별 통계
getMonthlyItemStatistics(year: number, month: number): Promise<{
  count: number;
  totalAmount: number;
}>
```

### Report Service (16개 함수)

#### 기본 CRUD

```typescript
// 생성
createReport(input: CreateReportInput): Promise<Report>

// 조회
getReports(): Promise<Report[]>
getReportById(id: string): Promise<Report | null>

// 수정
updateReport(id: string, updates: Partial<Report>): Promise<void>

// 삭제
deleteReport(id: string): Promise<void>
```

#### 상태 관리

```typescript
// 상태별 조회
getReportsByStatus(status: ReportStatus): Promise<Report[]>

// 제출 (draft → submitted)
submitReport(id: string): Promise<void>

// 승인 (submitted → approved)
approveReport(id: string): Promise<void>

// 거절 (submitted → rejected)
rejectReport(id: string): Promise<void>

// 임시저장으로 되돌리기
revertReportToDraft(id: string): Promise<void>
```

#### Item 연결 관리

```typescript
// Item 연결
linkItemToReport(reportId: string, itemId: string): Promise<void>

// Item 연결 해제
unlinkItemFromReport(reportId: string, itemId: string): Promise<void>

// 연결된 Item ID 목록
getReportItemIds(reportId: string): Promise<string[]>

// Item이 포함된 Report 조회
getReportsByItemId(itemId: string): Promise<Report[]>

// 총액 재계산
recalculateReportTotal(reportId: string): Promise<number>
```

#### 통계

```typescript
// 리포트 통계
getReportStatistics(): Promise<{
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
}>
```

### Utility Functions (14개 함수)

#### 트랜잭션

```typescript
// 안전한 트랜잭션 실행
executeTransaction(
  callback: () => Promise<void>
): Promise<void>
```

사용 예:

```typescript
await executeTransaction(async () => {
  const item = await createItem({...});
  await linkItemToReport(reportId, item.id);
  await recalculateReportTotal(reportId);
  // 모두 성공하거나 모두 롤백
});
```

#### 데이터베이스 관리

```typescript
// DB 통계
getDatabaseStatistics(): Promise<{
  items: number;
  reports: number;
  categories: number;
  databaseSize: number;
}>

// 공간 최적화
vacuumDatabase(): Promise<void>

// 쿼리 최적화 통계 업데이트
analyzeDatabase(): Promise<void>

// 무결성 검사
checkDatabaseIntegrity(): Promise<boolean>

// 외래키 제약 검사
checkForeignKeys(): Promise<boolean>
```

#### 헬퍼 함수

```typescript
// 고유 ID 생성
generateUniqueId(): string

// 날짜 ISO 변환
formatDateForDb(date: Date | string): string

// 날짜 파싱
parseDateFromDb(dateString: string): Date

// LIKE 쿼리 이스케이프
sanitizeLikeQuery(query: string): string

// 동적 WHERE 절 생성
buildWhereClause(
  conditions: Record<string, any>
): { clause: string; params: any[] }

// 테이블 존재 확인
tableExists(tableName: string): Promise<boolean>

// 테이블 행 개수
getTableRowCount(tableName: string): Promise<number>

// Raw SQL 실행
executeRawQuery<T>(
  query: string,
  params?: any[]
): Promise<T[]>
```

## 고급 기능

### 트랜잭션 사용

여러 DB 작업을 원자적으로 실행:

```typescript
import { executeTransaction } from '@/services/database';

try {
  await executeTransaction(async () => {
    // 여러 작업
    await createItem({...});
    await updateReport(reportId, {...});
    await recalculateReportTotal(reportId);
    // 모두 성공하거나 모두 롤백
  });
  console.log('트랜잭션 성공');
} catch (error) {
  console.error('트랜잭션 실패, 롤백됨:', error);
}
```

### 검색 및 필터

```typescript
import {
  getItemsByClassification,
  getItemsByDateRange,
  searchItems,
} from '@/services/database';

// 개인카드 증빙만
const personalCards = await getItemsByClassification('personal_card');

// 이번 달 증빙
const thisMonth = await getItemsByDateRange(
  '2024-02-01',
  '2024-02-29'
);

// 텍스트 검색
const results = await searchItems('점심');
```

### 통계 조회

```typescript
import {
  getDatabaseStatistics,
  getItemStatisticsByUsagePurpose,
  getReportStatistics,
} from '@/services/database';

// 전체 DB 통계
const dbStats = await getDatabaseStatistics();
console.log('총 증빙:', dbStats.items);
console.log('총 리포트:', dbStats.reports);
console.log('DB 크기:', dbStats.databaseSize, 'bytes');

// 용도별 통계
const purposeStats = await getItemStatisticsByUsagePurpose();
purposeStats.forEach(stat => {
  console.log(`${stat.usagePurpose}: ${stat.count}건, ${stat.totalAmount}원`);
});

// 리포트 통계
const reportStats = await getReportStatistics();
console.log('임시저장:', reportStats.draft);
console.log('제출됨:', reportStats.submitted);
console.log('승인됨:', reportStats.approved);
```

## React Native 통합

### Zustand Store와 연동

```typescript
import { create } from 'zustand';
import { getItems, createItem, deleteItem } from '@/services/database';
import type { Item } from '@/types';

interface ItemStore {
  items: Item[];
  loading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItem: (input: CreateItemInput) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

export const useItemStore = create<ItemStore>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await getItems();
      set({ items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addItem: async (input) => {
    try {
      const item = await createItem(input);
      set((state) => ({ items: [...state.items, item] }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  removeItem: async (id) => {
    try {
      await deleteItem(id);
      set((state) => ({
        items: state.items.filter(item => item.id !== id)
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },
}));
```

### 컴포넌트에서 사용

```typescript
import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useItemStore } from '@/store/itemStore';

function ItemListScreen() {
  const { items, loading, error, fetchItems } = useItemStore();

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.title}</Text>
          <Text>{item.amount?.toLocaleString()}원</Text>
        </View>
      )}
    />
  );
}
```

## 데이터베이스 관리

### 무결성 검사

```typescript
import {
  checkDatabaseIntegrity,
  checkForeignKeys,
} from '@/services/database';

// DB 무결성 검사
const isHealthy = await checkDatabaseIntegrity();
if (!isHealthy) {
  console.error('데이터베이스 손상 감지!');
}

// 외래키 제약 검사
const fkValid = await checkForeignKeys();
if (!fkValid) {
  console.error('외래키 제약 위반 감지!');
}
```

### 성능 최적화

```typescript
import { vacuumDatabase, analyzeDatabase } from '@/services/database';

// 공간 최적화 (삭제된 레코드 정리)
await vacuumDatabase();

// 쿼리 최적화 통계 업데이트
await analyzeDatabase();
```

### 데이터베이스 초기화

```typescript
import { resetDatabase } from '@/services/database';

// 경고: 모든 데이터 삭제됨!
await resetDatabase();
```

### 데이터베이스 리셋 (안전 패턴)

```typescript
import { Alert } from 'react-native';
import { resetDatabase } from '@/services/database';

function resetDatabaseSafely() {
  Alert.alert(
    '데이터 초기화',
    '모든 데이터가 삭제됩니다. 계속하시겠습니까?',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetDatabase();
            Alert.alert('완료', '데이터가 초기화되었습니다.');
          } catch (error) {
            Alert.alert('오류', '초기화 실패: ' + error.message);
          }
        },
      },
    ]
  );
}
```

## 에러 처리

모든 DB 작업은 try-catch로 감싸야 합니다:

```typescript
try {
  await createItem({...});
} catch (error) {
  console.error('DB 에러:', error);
  Alert.alert('오류', '데이터 저장 실패');
}
```

## 마이그레이션

데이터베이스 스키마 변경 시 마이그레이션을 사용합니다.

상세: `/services/database/migrations/README.md`

## 스키마 다이어그램

전체 스키마 다이어그램: `/services/database/SCHEMA_DIAGRAM.md`

## 파일 구조

```
services/database/
├── index.ts                # 모든 서비스 export
├── init.ts                 # DB 초기화
├── schema.ts               # 테이블 정의
├── itemService.ts          # Item CRUD (12 함수)
├── reportService.ts        # Report 관리 (16 함수)
├── categoryService.ts      # Category (레거시, 7 함수)
├── usagePurposeService.ts  # TODO: 용도 관리
├── utils.ts                # 유틸리티 (14 함수)
├── getDatabase.ts          # DB 인스턴스 헬퍼
├── migrations/             # 마이그레이션 스크립트
│   └── README.md
├── __tests__/              # 테스트
└── README.md               # 레거시 (이 파일로 대체됨)
```

## 참고

- 완료 리포트: `/docs/archived/database-completion-summary.md`
- 스키마 다이어그램: `/services/database/SCHEMA_DIAGRAM.md`
- 마이그레이션: `/services/database/migrations/README.md`
