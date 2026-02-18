# 정산 탭 (Reports Screen)

최근 정산 내역을 월별로 표시하고 상세 정보로 이동하는 탭 화면입니다.

## 경로

- **파일**: `/app/(tabs)/reports/index.tsx`
- **라우트**: `/(tabs)/reports`

## 기능

- **월별 카드**: 최근 6개월의 정산 요약 표시
- **분류별 통계**: 법인카드/개인카드/증명 금액 표시
- **상세 조회**: 카드 터치 시 월별 상세 화면 이동
- **당겨서 새로고침**: RefreshControl로 수동 갱신
- **동적 로딩**: 각 월별 데이터를 병렬로 로드

## 아키텍처

### 데이터 갱신 패턴

**이전 패턴 (버그 있음):**
```typescript
useEffect([], [])  // 마운트 1회만 로드 → 탭 전환 후 금액 미갱신
```

**현재 패턴 (개선됨):**
```typescript
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

useFocusEffect(
  useCallback(() => {
    loadAllMonths();  // 탭 포커스 시마다 갱신
  }, [])
);
```

**이유:**
- 항목 추가/수정 후 다른 탭으로 이동 후 돌아올 때
- 금액이 최신화되지 않던 버그 수정
- 탭 전환 시점에 데이터 자동 갱신

## 컴포넌트 구조

### ReportsScreen (메인)

```typescript
interface MonthData {
  year: number;
  month: number;
  summary: MonthlySummary;
  isLoading: boolean;
}

export default function ReportsScreen() {
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllMonths = async () => {
    // 1. 6개월 데이터 초기화 (로딩 상태)
    // 2. 각 월별 데이터 병렬 로드
    // 3. 결과 통합
  };

  useFocusEffect(useCallback(() => loadAllMonths(), []));
}
```

### MonthCard (월별 카드)

```typescript
interface MonthData {
  year: number;
  month: number;
  summary: MonthlySummary;
  isLoading: boolean;
}

function MonthCard({ data }: { data: MonthData }) {
  // 로딩 중 → 스피너 표시
  // 데이터 없음 → 비활성화된 상태 (opacity: 0.5)
  // 데이터 있음 → 금액 표시 + 터치 가능
}
```

## 월별 요약 (MonthlySummary)

```typescript
interface MonthlySummary {
  corporateCard: {
    totalAmount: number;
    count: number;
  };
  personalCard: {
    totalAmount: number;
    count: number;
  };
  proofDocument: {
    totalAmount: number;
    count: number;
  };
  total: {
    totalAmount: number;
    count: number;
  };
}
```

## 사용 API

### 서비스 함수

```typescript
import { getMonthlyItems, calculateMonthlySummary } from '@/services/export';

// 월별 항목 조회
const items = await getMonthlyItems(year, month);

// 통계 계산
const summary = calculateMonthlySummary(items);
```

### 병렬 로드

```typescript
const results = await Promise.all(
  months.map(async ({ year, month }) => {
    try {
      const items = await getMonthlyItems(year, month);
      const summary = calculateMonthlySummary(items);
      return { year, month, summary, isLoading: false };
    } catch (error) {
      // 에러 처리: 빈 데이터 반환
      return { year, month, summary: emptyMonthlySummary, isLoading: false };
    }
  })
);
```

## UI 상태

### 로딩 상태

```
┌─────────────────┐
│   [로딩 중...]   │
└─────────────────┘
```

ActivityIndicator 표시 (크기: small, 색상: #3B82F6)

### 데이터 없음

```
┌──────────────────────┐
│ 2024년 2월          │
│ 항목 없음           │
│ (비활성화, 터치 불가) │
└──────────────────────┘
```

Opacity 50%, 오른쪽 화살표 없음

### 데이터 있음

```
┌──────────────────────┐
│ 2024년 2월         ▶ │
│ 총 5건               │
├──────────────────────┤
│ ₩125,000            │
└──────────────────────┘
```

- 분류별 내역 (선택사항, 현재 미표시)
- 총 금액 큰 글씨 표시
- 터치 가능 (상세 화면으로 이동)

## 새로고침

### 수동 갱신 (Pull-to-Refresh)

```typescript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor="#3B82F6"
    />
  }
/>
```

### 자동 갱신 (탭 전환)

```typescript
useFocusEffect(
  useCallback(() => {
    loadAllMonths();  // 탭 포커스 시 자동 호출
  }, [])
);
```

## 다크모드

모든 텍스트와 배경이 다크모드 대응:

```typescript
<View className="bg-white dark:bg-gray-800">
  <Text className="text-gray-900 dark:text-gray-100">...</Text>
</View>
```

## 성능 특성

### 최적화

- **병렬 로드**: 6개월을 동시에 로드 (순차 로드 X)
- **로딩 상태 즉시 표시**: UI 반응성 향상
- **에러 격리**: 한 달 로드 실패해도 다른 달은 정상 표시

### 성능 지표

| 메트릭 | 목표 | 실제 |
|-------|------|------|
| 초기 렌더링 | < 1초 | ~0.5초 |
| 월별 로드 | < 100ms | ~50-200ms (기기 및 DB 크기 따라) |
| 갱신 완료 | < 2초 | ~1-3초 |

## 에러 처리

### 로드 실패

한 달 로드 실패 시:

```typescript
catch (error) {
  console.error(`Failed to load ${year}-${month}:`, error);
  return {
    year, month,
    summary: emptyMonthlySummary,  // 빈 데이터
    isLoading: false,
  };
}
```

**효과**: 해당 월은 "항목 없음"으로 표시, 다른 월은 정상 표시

## 사용자 여정

1. **정산 탭 진입** → useFocusEffect 실행
2. **데이터 로드 중** → 월별 카드에 로딩 표시
3. **로드 완료** → 금액 표시
4. **카드 터치** → 월별 상세 화면 이동 (`/(tabs)/reports/monthly/{year}/{month}`)
5. **당겨서 새로고침** → 수동 갱신

## 참고

- [useFocusEffect](https://docs.expo.dev/router/advanced/custom-hooks/#usefocuseffect) - Expo Router 포커스 이벤트
- [RefreshControl](https://reactnative.dev/docs/refreshcontrol) - React Native 당겨서 새로고침
