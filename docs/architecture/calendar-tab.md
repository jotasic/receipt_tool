# 달력 탭 구조

Receipt Tool의 달력 탭 구조 및 뷰 관리 방식입니다.

## 개요

달력 탭은 증빙을 월별/일별로 시각화하고, SegmentedControl을 사용하여 뷰를 전환하는 화면입니다.

### 날짜 범위 제한

성능 최적화를 위해 달력 표시 범위를 제한합니다:

- **과거**: 현재 기준 3개월 전
- **미래**: 현재 기준 3개월 후

**상수**: `/constants/calendarRange.ts`

```typescript
export const CALENDAR_PAST_MONTHS = 3;
export const CALENDAR_FUTURE_MONTHS = 3;

export function getCalendarDateRange(): { minDate: string; maxDate: string } {
  // 오늘 기준 ±3개월 범위 반환 (YYYY-MM-DD 형식)
}
```

**적용:**
- `MonthViewCalendar`: 표시 범위 제한 (무한 스크롤 방지)
- `AgendaCalendar`: `pastScrollRange={3}`, `futureScrollRange={3}`

**미적용:**
- `DatePickerInput`: 사용자는 어느 날짜든 입력 가능 (범위 제한 없음)

## 라우팅 구조

```
app/(tabs)/calendar/
├── _layout.tsx           (달력 탭 Stack + Header)
└── index.tsx             (달력 뷰 콘텐츠)
```

### 경로

| 화면 | 경로 | 파일 |
|------|------|------|
| 달력 홈 | `/calendar` | `app/(tabs)/calendar/index.tsx` |

## 아키텍처

### _layout.tsx (달력 탭 레이아웃)

```typescript
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';

export default function CalendarTabLayout() {
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      {/* Header는 달력 탭의 제목만 표시 */}
      <Header title="달력" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </SafeAreaView>
  );
}
```

**특징:**
- SafeAreaView로 전체 감싸기
- Header는 고정 제목 "달력" 표시
- 2depth 화면 없음 (단일 화면)
- FloatingActionBar 없음

### index.tsx (달력 뷰)

```typescript
import { View, Text } from 'react-native';
import { SegmentedControl } from '@react-native-segmented-control/segmented-control';
import { useState } from 'react';
import { MonthlyCalendarView } from '@/components/calendar/MonthlyCalendarView';
import { DailyCalendarView } from '@/components/calendar/DailyCalendarView';

export default function CalendarTab() {
  const [viewMode, setViewMode] = useState(0); // 0: 월별, 1: 일별

  return (
    <View className="flex-1">
      {/* SegmentedControl: 뷰 전환 */}
      <SegmentedControl
        values={['월별', '일별']}
        selectedIndex={viewMode}
        onChange={(event) => {
          setViewMode(event.nativeEvent.selectedSegmentIndex);
        }}
        className="m-4"
      />

      {/* 조건부 콘텐츠 렌더링 */}
      {viewMode === 0 ? (
        <MonthlyCalendarView />
      ) : (
        <DailyCalendarView />
      )}
    </View>
  );
}
```

**특징:**
- 콘텐츠만 반환 (Header, SafeAreaView는 _layout.tsx에서 관리)
- SegmentedControl으로 뷰 전환
- 탭 내부 상태로 뷰 모드 관리

## SegmentedControl 사용 가이드

### 개요

SegmentedControl은 탭 내에서 여러 뷰를 전환하는 데 사용됩니다. 탭 바와는 다르며, 같은 탭 내에서만 콘텐츠를 변경합니다.

### 구현 패턴

```typescript
import { SegmentedControl } from '@react-native-segmented-control/segmented-control';
import { useState } from 'react';

export default function CalendarTab() {
  // 현재 선택된 뷰 인덱스
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 뷰 옵션
  const viewOptions = ['월별', '일별', '통계'];

  const handleSegmentChange = (event: any) => {
    setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
  };

  return (
    <View className="flex-1">
      {/* SegmentedControl */}
      <SegmentedControl
        values={viewOptions}
        selectedIndex={selectedIndex}
        onChange={handleSegmentChange}
        // 스타일 (필요에 따라 커스터마이징)
        appearance="light"
      />

      {/* 뷰 렌더링 */}
      {selectedIndex === 0 && <MonthlyView />}
      {selectedIndex === 1 && <DailyView />}
      {selectedIndex === 2 && <StatisticsView />}
    </View>
  );
}
```

### 주요 Props

| Prop | 타입 | 설명 |
|------|------|------|
| `values` | `string[]` | 세그먼트 레이블 배열 |
| `selectedIndex` | `number` | 현재 선택된 인덱스 |
| `onChange` | `(event) => void` | 선택 변경 핸들러 |
| `appearance` | `"light" \| "dark"` | 외관 (라이트/다크) |

### 스타일링

NativeWind를 사용한 스타일링:

```typescript
<SegmentedControl
  values={['월별', '일별']}
  selectedIndex={viewMode}
  onChange={handleChange}
  className="mx-4 my-2"
  // 직접 스타일은 style prop 사용
  style={{
    height: 44,
  }}
/>
```

## 뷰 간 상태 관리

### 패턴 1: 각 뷰가 독립적인 상태 유지

```typescript
export default function CalendarTab() {
  const [viewMode, setViewMode] = useState(0);

  // 각 뷰는 자신의 상태를 관리
  const monthlyView = <MonthlyCalendarView />;
  const dailyView = <DailyCalendarView />;

  return (
    <View>
      <SegmentedControl
        values={['월별', '일별']}
        selectedIndex={viewMode}
        onChange={(event) => setViewMode(event.nativeEvent.selectedSegmentIndex)}
      />
      {viewMode === 0 ? monthlyView : dailyView}
    </View>
  );
}
```

**장점:**
- 각 뷰의 상태가 독립적
- 뷰 전환 후 이전 상태 유지

**단점:**
- 공유 상태 관리 복잡

### 패턴 2: 상위에서 공유 상태 관리

```typescript
export default function CalendarTab() {
  const [viewMode, setViewMode] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <View>
      <SegmentedControl
        values={['월별', '일별']}
        selectedIndex={viewMode}
        onChange={(event) => setViewMode(event.nativeEvent.selectedSegmentIndex)}
      />
      {viewMode === 0 ? (
        <MonthlyCalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      ) : (
        <DailyCalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}
    </View>
  );
}
```

**장점:**
- 뷰 간 상태 공유 가능
- 날짜 선택 등 공통 상태 관리 용이

**단점:**
- 상위 컴포넌트의 상태 증가

## 성능 최적화

### 달력 범위 제한

무한 스크롤을 방지하기 위해 `getCalendarDateRange()` 사용:

```typescript
import { getCalendarDateRange } from '@/constants/calendarRange';

function MonthlyCalendarView() {
  const { minDate, maxDate } = getCalendarDateRange();

  return (
    <Calendar
      minDate={minDate}
      maxDate={maxDate}
      // ...
    />
  );
}
```

### React.memo 활용

```typescript
const MonthlyCalendarView = React.memo(({ selectedDate, onSelectDate }: Props) => {
  return (
    // 콘텐츠
  );
});
```

### useMemo로 불필요한 리렌더링 방지

```typescript
const monthlyView = useMemo(
  () => <MonthlyCalendarView selectedDate={selectedDate} />,
  [selectedDate]
);

const dailyView = useMemo(
  () => <DailyCalendarView selectedDate={selectedDate} />,
  [selectedDate]
);

return (
  <>
    {viewMode === 0 ? monthlyView : dailyView}
  </>
);
```

## 다크모드 지원

SegmentedControl의 appearance prop으로 다크모드 자동 지원:

```typescript
import { useColorScheme } from 'react-native';

export default function CalendarTab() {
  const colorScheme = useColorScheme();
  const [viewMode, setViewMode] = useState(0);

  return (
    <SegmentedControl
      values={['월별', '일별']}
      selectedIndex={viewMode}
      onChange={(event) => setViewMode(event.nativeEvent.selectedSegmentIndex)}
      appearance={colorScheme ?? 'light'}
    />
  );
}
```

## 체크리스트

달력 탭 구현 시 확인 사항:

- [ ] `app/(tabs)/calendar/_layout.tsx` 생성
- [ ] `app/(tabs)/calendar/index.tsx` 생성
- [ ] SegmentedControl 설정
- [ ] 각 뷰 컴포넌트 구현
- [ ] 상태 관리 패턴 선택
- [ ] 다크모드 지원 확인
- [ ] TypeScript 컴파일 확인
- [ ] 뷰 전환 동작 테스트

## 참고

- [Layout Policy](/docs/guides/layout-policy.md) - 레이아웃 정책
- [Routing Structure](/docs/architecture/routing-structure.md) - 라우팅 구조
- [@react-native-segmented-control/segmented-control](https://github.com/react-native-segmented-control/segmented-control) - 공식 문서

## 최종 업데이트

**날짜:** 2026-02-17
**상태:** 현재 계획/구현 중
