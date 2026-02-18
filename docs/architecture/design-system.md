# 디자인 시스템 아키텍처

회사 경비 청구 앱의 디자인 시스템 구조와 구현 방식을 설명합니다.

## 개요

디자인 시스템은 토큰(tokens), 레이아웃 컴포넌트(layouts), 훅(hooks)으로 구성되어 있습니다.

```
디자인 시스템
├── tokens/          ← 색상, 간격, 타이포그래피 정의
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── index.ts
│
├── layouts/         ← 화면 레이아웃 컴포넌트
│   ├── ScreenLayout.tsx      (일반 화면)
│   ├── TabScreenLayout.tsx   (탭 화면)
│   ├── ModalLayout.tsx       (모달 화면)
│   └── index.ts
│
└── hooks/           ← 다크모드 대응 훅
    ├── useThemeColor.ts
    ├── useThemedStyles.ts
    └── index.ts
```

## 토큰 시스템

### 토큰 구조

```typescript
// design-system/tokens/index.ts
export const tokens = {
  colors,              // 색상 팔레트
  spacing,             // 간격 스케일
  borderRadius,        // 반경 스케일
  fontSize,            // 폰트 크기
  fontWeight,          // 폰트 굵기
  lineHeight,          // 라인 높이
  letterSpacing,       // 글자 간격
} as const;
```

### 색상 토큰 (colors.ts)

색상은 3가지 카테고리로 나뉩니다:

#### 1. 기본 의미 색상

```typescript
colors.primary         // 파란색 (#3B82F6)
colors.secondary       // 회색 (#6B7280)
colors.success         // 초록색 (#10B981)
colors.warning         // 주황색 (#F59E0B)
colors.error           // 빨간색 (#EF4444)
```

#### 2. 분류 색상 (데이터 기반)

`constants/items.ts`의 ItemClassification 분류와 매핑됩니다:

```typescript
colors.classification = {
  corporateCard: '#10B981',    // 법인카드
  personalCard: '#3B82F6',     // 개인카드
  proofDocument: '#8B5CF6',    // 증명
}
```

#### 3. 모드별 색상

라이트/다크 모드 전환을 위한 색상 세트:

```typescript
colors.light = {
  background: '#F9FAFB',           // 주 배경
  surface: '#FFFFFF',              // 카드 배경
  border: '#E5E7EB',               // 테두리
  text: { primary, secondary, muted },
}

colors.dark = {
  background: '#111827',           // 주 배경
  surface: '#1F2937',              // 카드 배경
  border: '#374151',               // 테두리
  text: { primary, secondary, muted },
}
```

### 간격 토큰 (spacing.ts)

4px 기반의 8단계 스케일:

```typescript
spacing = {
  xs: 4,      // 가장 작음
  sm: 8,
  md: 16,     // 기본값 (권장)
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,  // 가장 큼
}

borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,  // 완전 원
}
```

### 타이포그래피 토큰 (typography.ts)

```typescript
fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, ... }
fontWeight = { regular: '400', medium: '500', semibold: '600', bold: '700' }
lineHeight = { tight: 1.2, normal: 1.5, relaxed: 1.75 }
letterSpacing = { tight: -0.5, normal: 0, wide: 0.5 }
```

## 레이아웃 컴포넌트

### 컴포넌트 구조

```
레이아웃 컴포넌트
├── ScreenLayout (모든 일반 화면)
│   ├── SafeAreaView (edges: 모든 방향)
│   ├── Header (자동: title 설정 시 표시)
│   │   ├── 왼쪽: 뒤로가기 (자동: 경로에 따라)
│   │   ├── 가운데: 제목
│   │   └── 오른쪽: 커스텀 요소 (선택)
│   ├── ScrollView 또는 View
│   └── 콘텐츠
│
└── FullScreenModal (추가/수정 폼)
    ├── SafeAreaView (edges: top만)
    ├── Modal Header (항상)
    │   ├── 왼쪽: X 버튼
    │   ├── 가운데: 제목
    │   └── 오른쪽: 액션 버튼
    ├── ScrollView 또는 View
    └── 콘텐츠
```

### DatePickerInput - 날짜 선택 입력

**사용 대상**: 모든 날짜 입력 필드 (항목 추가/수정 등)

**기술**: react-native-calendars 기반 순수 JS 구현 (native module 불필요, Expo Go 호환)

**특징**:
- 터치 시 Modal 내에서 Calendar 표시
- 월/연도 네비게이션 가능
- 다크모드 완벽 지원
- 날짜 범위 제한 없음 (사용자는 어느 날짜든 입력 가능)

**Props**:
```typescript
interface DatePickerInputProps {
  label?: string;              // 입력 필드 라벨
  value: string;               // 선택된 날짜 (YYYY-MM-DD)
  onChange: (date: string) => void;  // 날짜 변경 콜백
  error?: string;              // 에러 메시지
}
```

**Example:**
```typescript
const [date, setDate] = useState('2024-02-15');

<DatePickerInput
  label="지출 날짜"
  value={date}
  onChange={setDate}
  error={!date ? '날짜를 선택하세요' : undefined}
/>
```

### ScreenLayout - 모든 일반 화면

**사용 대상**: 모든 일반 화면 (탭, 상세, 설정 등)

**특징**:
- 제목 설정 시 자동으로 헤더 표시
- 뒤로가기 버튼은 경로에 따라 자동 처리
  - 1depth (`/(tabs)/*`): 뒤로가기 없음
  - 2depth+ (탭 외부): 뒤로가기 자동 표시
- 탭 바는 경로에 따라 자동 표시/숨김
- 오른쪽 커스텀 요소 지원
- 스크롤 가능/불가 선택

**Props**:
```typescript
interface ScreenLayoutProps {
  title?: string;              // 헤더 타이틀
  rightElement?: ReactNode;    // 헤더 오른쪽 요소
  scrollable?: boolean;        // 스크롤 가능 여부
  children: ReactNode;
}
```

**다크모드**: `dark:bg-gray-900` 클래스로 자동 대응

```typescript
// 1depth 탭 화면 (자동으로 뒤로가기 없음, 탭 바 표시)
<ScreenLayout title="리포트">
  <ReportList />
</ScreenLayout>

// 2depth 상세 화면 (자동으로 뒤로가기 표시, 탭 바 숨김)
<ScreenLayout title="리포트 상세">
  <ReportDetail />
</ScreenLayout>

// 오른쪽 요소가 있는 화면
<ScreenLayout
  title="설정"
  rightElement={<TouchableOpacity onPress={handleSettings}>...</TouchableOpacity>}
>
  <SettingsList />
</ScreenLayout>
```

### FullScreenModal - 추가/수정 폼 전용

**사용 대상**: 모든 추가/수정/삭제 확인 폼

**특징**:
- 현재 화면 위에 모달로 표시 (새로운 경로 없음)
- SafeAreaView는 top만 적용 (소프트키 완벽 회피)
- 하단 버튼 없음 (오른쪽 액션 버튼만 사용)
- 왼쪽 X 버튼으로 닫기
- 오른쪽에 액션 버튼 (생성/저장/삭제 등)

**Props**:
```typescript
interface FullScreenModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  rightButton?: {
    label: string;
    onPress: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
  };
  children: ReactNode;
}
```

**다크모드**: 자동 대응

```typescript
<FullScreenModal
  visible={showForm}
  onClose={() => setShowForm(false)}
  title="새 항목"
  rightButton={{
    label: '생성',
    onPress: handleCreate,
    disabled: !isValid,
  }}
>
  <ItemForm />
</FullScreenModal>
```

## 훅 시스템

### useThemeColor - 기본 색상 선택

```typescript
export function useThemeColor(light: string, dark: string): string
```

**목적**: 라이트/다크 모드에 따라 색상 자동 선택

**사용 시기**:
- 고정된 색상 코드로 모드 대응
- 복잡한 스타일이 필요 없을 때

**내부 구현**:
```typescript
const colorScheme = useColorScheme();
return colorScheme === 'dark' ? dark : light;
```

### useThemedStyles - 동적 스타일시트

```typescript
export function useThemedStyles<T>(
  createStyles: (colors: ThemeColors) => T
): T
```

**목적**: 색상 팔레트 접근하여 스타일시트 생성

**색상 팔레트**:
```typescript
interface ThemeColors {
  scheme: 'light' | 'dark';
  background: string;           // 주 배경색
  backgroundSecondary: string;  // 보조 배경색
  text: string;                 // 주 텍스트색
  textSecondary: string;        // 보조 텍스트색
  border: string;               // 테두리색
  primary: string;              // 액센트색
  error: string;                // 에러색
  success: string;              // 성공색
  warning: string;              // 경고색
  info: string;                 // 정보색
}
```

**사용 시기**:
- 복잡한 스타일이 필요할 때
- StyleSheet 최적화가 필요할 때
- 색상 팔레트 직접 접근이 필요할 때

**성능 특성**:
- `useMemo` 2개로 최적화
- 색상 스킴 변경 시만 재계산
- 컴포넌트 재렌더링 최소화

### useThemeColors - 색상만 접근

```typescript
export function useThemeColors(): ThemeColors
```

**목적**: 스타일시트 없이 색상 팔레트만 접근

**사용 시기**:
- 색상만 필요할 때
- 인라인 스타일로 충분할 때

## 다크모드 대응 전략

### 우선순위

1. **NativeWind 클래스** (권장)
   ```typescript
   <View className="bg-white dark:bg-gray-900" />
   ```

2. **useThemedStyles 훅**
   ```typescript
   const styles = useThemedStyles((colors) => ({
     container: { backgroundColor: colors.background }
   }))
   ```

3. **useThemeColor 훅**
   ```typescript
   const bgColor = useThemeColor('#FFF', '#111')
   ```

### 구현 방식

#### NativeWind 클래스

- 간단하고 직관적
- TailwindCSS 문법 사용
- 자동 다크 모드 대응

#### 훅 기반 (필요시)

- `useColorScheme()` 호출로 현재 모드 감지
- 스타일 객체 또는 색상 값 반환
- 동적 스타일이 필요한 경우만 사용

## 확장 가능성

### 새 색상 추가

```typescript
// design-system/tokens/colors.ts
export const colors = {
  // ... 기존 색상

  // 새 카테고리 추가
  custom: {
    highlight: '#FFD700',
    muted: '#A9A9A9',
  },
} as const;
```

### 새 토큰 추가

```typescript
// design-system/tokens/index.ts
export const tokens = {
  // ... 기존 토큰
  custom: {
    shadows: { sm: '0 1px 2px', lg: '0 10px 15px' },
    animations: { fast: 200, normal: 300, slow: 500 },
  },
};
```

### 새 레이아웃 컴포넌트

```typescript
// design-system/layouts/SidebarLayout.tsx
export function SidebarLayout({ sidebar, children }: Props) {
  return (
    <SafeAreaView className="flex-1 flex-row bg-white dark:bg-gray-900">
      <View className="w-64 border-r border-gray-200 dark:border-gray-700">
        {sidebar}
      </View>
      <View className="flex-1">
        {children}
      </View>
    </SafeAreaView>
  );
}

// design-system/layouts/index.ts에 추가
export { SidebarLayout } from './SidebarLayout';
```

## 통합 점

### Tailwind CSS 연계

NativeWind는 TailwindCSS 설정을 사용합니다. 토큰은 다음에서 참조됩니다:

- 색상: `colors.tsx` (Tailwind 컬러 팔레트)
- 간격: `spacing.ts` (Tailwind 간격 스케일)
- 타이포그래피: `typography.ts` (Tailwind 타이포 스케일)

### 상수 연계

디자인 토큰은 기존 상수와 동기화됩니다:

```typescript
// constants/items.ts의 분류
type ItemClassification = 'personal_card' | 'corporate_card' | 'proof_document';

// design-system/tokens/colors.ts의 분류 색상
colors.classification = {
  personalCard: ...,
  corporateCard: ...,
  proofDocument: ...,
};
```

## 성능 최적화

### 메모이제이션

```typescript
// useThemedStyles
const styles = useMemo(
  () => StyleSheet.create(createStyles(colors)),
  [colors, createStyles]  // 색상 또는 함수 변경 시만 재계산
);
```

### 색상 스킴 감지

```typescript
// 시스템 설정 변경 시 자동 감지 및 업데이트
const colorScheme = useColorScheme();
```

### StyleSheet 캐싱

React Native의 `StyleSheet.create()`는 자동으로 스타일을 최적화합니다.

## 베스트 프랙티스

### 1. 토큰 활용

❌ 하드코딩:
```typescript
<View style={{ backgroundColor: '#F9FAFB' }} />
```

✅ 토큰 사용:
```typescript
import { colors } from '@/design-system/tokens';
<View style={{ backgroundColor: colors.light.background }} />
```

### 2. 레이아웃 컴포넌트 사용

❌ 직접 SafeAreaView:
```typescript
<SafeAreaView>
  <Header ... />
  <ScrollView>...</ScrollView>
</SafeAreaView>
```

✅ 레이아웃 컴포넌트:
```typescript
<ScreenLayout title="화면 제목">
  ...
</ScreenLayout>

// 추가/수정 폼
<FullScreenModal
  visible={visible}
  onClose={onClose}
  title="항목 추가"
  rightButton={{ label: '생성', onPress: handleCreate }}
>
  ...
</FullScreenModal>
```

### 3. 다크모드 대응

❌ 수동 색상 선택:
```typescript
const bgColor = colorScheme === 'dark' ? '#111' : '#FFF';
```

✅ 훅 사용:
```typescript
const bgColor = useThemeColor('#FFF', '#111');
```

### 4. 일관된 간격

❌ 임의 값:
```typescript
<View style={{ padding: 13 }} />
```

✅ 토큰 값:
```typescript
import { spacing } from '@/design-system/tokens';
<View style={{ padding: spacing.md }} />
```
