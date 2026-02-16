# 디자인 시스템 설정 가이드

다른 React Native 프로젝트에 디자인 시스템을 적용하는 방법을 설명합니다.

---

## 개요

이 가이드는 receipt_tool의 디자인 시스템을 다른 React Native + Expo 프로젝트에 적용하는 방법을 단계별로 설명합니다.

**디자인 시스템의 핵심:**
- 디자인 토큰 (색상, 간격, 타이포그래피)
- NativeWind (Tailwind CSS) 스타일링
- 커스텀 React 훅 (테마, 다크모드)
- 레이아웃 컴포넌트

---

## 필수 의존성

### npm 설치

```bash
npm install --save \
  nativewind@^4.2.1 \
  tailwindcss@^3.4.19 \
  react-native-safe-area-context@~5.6.0

npm install --save-dev \
  typescript@~5.9.2
```

### 버전 요구사항

| 패키지 | 최소 버전 | 비고 |
|--------|----------|------|
| expo | ~54.0.0 | React Native 기반 |
| react | 19.0.0+ | React 최신 버전 |
| react-native | 0.81.0+ | NativeWind 호환 |
| nativewind | ^4.0.0 | Tailwind CSS 적용 |
| tailwindcss | ^3.3.0 | 필수 의존성 |

---

## 폴더 구조 복사

### 1단계: design-system 폴더 생성

receipt_tool에서 아래 구조를 프로젝트 루트에 복사하세요:

```bash
src/
└── design-system/
    ├── tokens/
    │   ├── colors.ts          # 색상 토큰
    │   ├── spacing.ts         # 간격 토큰
    │   ├── typography.ts      # 타이포그래피 토큰
    │   └── index.ts           # 인덱스 파일
    ├── hooks/
    │   ├── useThemeColor.ts   # 테마 색상 선택 훅
    │   ├── useThemedStyles.ts # 테마 스타일 생성 훅
    │   ├── useThemeColors.ts  # 테마 색상 객체 훅
    │   └── index.ts           # 인덱스 파일
    ├── layouts/
    │   ├── ScreenLayout.tsx   # 기본 화면 레이아웃
    │   ├── TabScreenLayout.tsx # 탭 화면 레이아웃
    │   ├── ModalLayout.tsx     # 모달 레이아웃
    │   └── index.ts            # 인덱스 파일
    └── README.md
```

### 2단계: 핵심 파일 복사

receipt_tool에서 다음 파일을 프로젝트에 복사하세요:

**토큰 파일:**
- `/design-system/tokens/colors.ts`
- `/design-system/tokens/spacing.ts`
- `/design-system/tokens/typography.ts`
- `/design-system/tokens/index.ts`

**훅 파일:**
- `/design-system/hooks/useThemeColor.ts`
- `/design-system/hooks/useThemedStyles.ts`
- `/design-system/hooks/useThemeColors.ts`
- `/design-system/hooks/index.ts`

**레이아웃 파일:**
- `/design-system/layouts/ScreenLayout.tsx`
- `/design-system/layouts/TabScreenLayout.tsx`
- `/design-system/layouts/ModalLayout.tsx`
- `/design-system/layouts/index.ts`

### 3단계: 경로 별칭 설정

`tsconfig.json`에서 design-system 경로 별칭 추가:

```json
{
  "compilerOptions": {
    "paths": {
      "@/design-system": ["./src/design-system"],
      "@/design-system/tokens": ["./src/design-system/tokens"],
      "@/design-system/hooks": ["./src/design-system/hooks"],
      "@/design-system/layouts": ["./src/design-system/layouts"]
    }
  }
}
```

---

## 초기 설정 체크리스트

### NativeWind 설정

```bash
# nativewind 초기화 (Expo 프로젝트)
npx nativewind init
```

이 명령어가 자동으로 생성하는 파일:
- `babel.config.js` 수정
- `tailwind.config.js` 생성

### 수동 설정 (필요시)

**babel.config.js:**

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
```

**tailwind.config.js:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // 프로젝트 기반 색상 토큰 추가
        primary: '#3B82F6',
        secondary: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
    },
  },
  plugins: [],
};
```

### 체크리스트

- [ ] nativewind 설치 완료
- [ ] design-system 폴더 복사 완료
- [ ] 경로 별칭 설정 완료
- [ ] babel.config.js 설정 완료
- [ ] tailwind.config.js 설정 완료
- [ ] TypeScript 재시작 (`tsc --noEmit`)

---

## 사용 방법

### 1. 기본 스타일링 (NativeWind)

```tsx
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="bg-white dark:bg-gray-900 p-4 rounded-lg">
      <Text className="text-gray-900 dark:text-gray-50 text-lg font-semibold">
        Hello
      </Text>
    </View>
  );
}
```

### 2. 동적 색상 (useThemeColor)

```tsx
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks';

export function MyIcon() {
  const iconColor = useThemeColor('#374151', '#D1D5DB');

  return (
    <View>
      <Ionicons name="heart" size={24} color={iconColor} />
    </View>
  );
}
```

### 3. 테마 색상 객체 (useThemeColors)

```tsx
import { View, Text } from 'react-native';
import { useThemeColors } from '@/design-system/hooks';

export function MyCard() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Title</Text>
      <Text style={{ color: colors.textSecondary }}>Description</Text>
    </View>
  );
}
```

### 4. 복잡한 스타일 (useThemedStyles)

```tsx
import { View, Text } from 'react-native';
import { useThemedStyles } from '@/design-system/hooks';

export function MyShadowBox() {
  const styles = useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      padding: 16,
      borderRadius: 8,
    },
  }));

  return (
    <View style={styles.container}>
      <Text>Content</Text>
    </View>
  );
}
```

### 5. 레이아웃 컴포넌트 (ScreenLayout)

```tsx
import { View } from 'react-native';
import { ScreenLayout } from '@/design-system/layouts';

export function MyScreen() {
  return (
    <ScreenLayout
      title="My Screen"
      showHeader
      showBack
      scrollable
    >
      <View className="p-4">
        <Text>Screen content here</Text>
      </View>
    </ScreenLayout>
  );
}
```

---

## 커스터마이징 가이드

### 1. 프로젝트별 색상 토큰 추가

**파일:** `design-system/tokens/colors.ts`

```typescript
export const colors = {
  // 기존 색상...

  // 프로젝트 고유 색상 추가
  brand: {
    primary: '#FF6B35',
    secondary: '#004E89',
  },

  status: {
    pending: '#FFA500',
    approved: '#28A745',
    rejected: '#DC3545',
  },
} as const;
```

**tailwind.config.js 업데이트:**

```javascript
theme: {
  extend: {
    colors: {
      'brand-primary': '#FF6B35',
      'brand-secondary': '#004E89',
      'status-pending': '#FFA500',
      'status-approved': '#28A745',
      'status-rejected': '#DC3545',
    },
  },
},
```

### 2. 기본 폰트 변경

**파일:** `design-system/tokens/typography.ts`

```typescript
// 기본 폰트 정의
export const fontFamily = {
  sans: 'System', // iOS/Android 기본 폰트
  serif: 'Georgia',
  mono: 'Menlo',
} as const;

// 커스텀 폰트 (expo-font 사용)
export const customFontFamily = {
  primary: 'PlusJakartaSans-Medium',
  mono: 'DotGothic16-Regular',
} as const;
```

**레이아웃 컴포넌트에 적용:**

```tsx
import * as Font from 'expo-font';

export async function preloadFonts() {
  await Font.loadAsync({
    'PlusJakartaSans-Medium': require('@/assets/fonts/PlusJakartaSans-Medium.ttf'),
  });
}
```

### 3. 다크모드 색상 커스터마이징

**파일:** `design-system/tokens/colors.ts`

```typescript
export const colors = {
  // ...

  light: {
    background: '#FAFAFA', // 변경
    surface: '#FFFFFF',
    border: '#E8E8E8',     // 변경
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      muted: '#999999',
    },
  },

  dark: {
    background: '#121212', // 변경
    surface: '#1E1E1E',
    border: '#2A2A2A',
    text: {
      primary: '#F5F5F5',
      secondary: '#BDBDBD',
      muted: '#808080',
    },
  },
} as const;
```

### 4. 새 훅 추가

**파일:** `design-system/hooks/useCustomHook.ts`

```typescript
import { useColorScheme } from 'react-native';

/**
 * 커스텀 훅 예시
 */
export function useCustomHook() {
  const colorScheme = useColorScheme();

  return {
    isDark: colorScheme === 'dark',
    scheme: colorScheme,
  };
}
```

**인덱스 파일 업데이트:** `design-system/hooks/index.ts`

```typescript
export { useThemeColor } from './useThemeColor';
export { useThemedStyles } from './useThemedStyles';
export { useThemeColors } from './useThemeColors';
export { useCustomHook } from './useCustomHook'; // 추가
```

### 5. 기본 레이아웃 컴포넌트 확장

**파일:** `design-system/layouts/CustomLayout.tsx`

```tsx
import { View, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

interface CustomLayoutProps {
  children: ReactNode;
  variant?: 'default' | 'compact' | 'spacious';
}

export function CustomLayout({
  children,
  variant = 'default'
}: CustomLayoutProps) {
  const colorScheme = useColorScheme();

  const paddingMap = {
    default: 16,
    compact: 8,
    spacious: 24,
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: paddingMap[variant]
        }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## 다크모드 구현

### 자동 다크모드 감지

React Native의 `useColorScheme()`을 사용하여 자동 감지:

```tsx
import { useColorScheme } from 'react-native';

function MyComponent() {
  const colorScheme = useColorScheme();

  return (
    <View>
      {colorScheme === 'dark' && <Text>Dark mode</Text>}
      {colorScheme === 'light' && <Text>Light mode</Text>}
    </View>
  );
}
```

### NativeWind dark: 클래스

```tsx
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-gray-50">
    Adaptive text
  </Text>
</View>
```

### tailwind.config.js 설정

```javascript
module.exports = {
  darkMode: 'class', // class 기반 다크모드
  // ...
};
```

---

## 성능 최적화

### 1. 메모이제이션

```tsx
import { memo } from 'react';
import { View, Text } from 'react-native';

const OptimizedComponent = memo(function MyComponent({ title }: { title: string }) {
  return (
    <View className="p-4">
      <Text>{title}</Text>
    </View>
  );
});
```

### 2. useThemedStyles 메모이제이션

useThemedStyles는 자동으로 메모이제이션되지만, 콜백 함수는 안정적이어야 합니다:

```tsx
import { useCallback } from 'react';
import { useThemedStyles } from '@/design-system/hooks';

function MyComponent() {
  const createStyles = useCallback((colors) => ({
    container: {
      backgroundColor: colors.background,
    },
  }), []);

  const styles = useThemedStyles(createStyles);

  return <View style={styles.container} />;
}
```

### 3. 큰 리스트에서 NativeWind 피하기

동적 스타일이 많으면 StyleSheet 사용:

```tsx
import { StyleSheet, View, FlatList } from 'react-native';
import { useThemedStyles } from '@/design-system/hooks';

const ListItem = memo(function ListItem({ item }: { item: any }) {
  const styles = useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.border,
      borderWidth: 1,
      padding: 12,
      marginBottom: 8,
      borderRadius: 8,
    },
    text: {
      color: colors.text,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{item.title}</Text>
    </View>
  );
});
```

---

## 트러블슈팅

### 1. NativeWind 클래스가 적용되지 않음

**해결:**
- `babel.config.js`의 `jsxImportSource: 'nativewind'` 확인
- Metro bundler 재시작: `npx expo start --clear`
- TypeScript 캐시 정리: `rm -rf node_modules/.cache`

### 2. 다크모드가 감지되지 않음

**해결:**
- Expo: Settings > Accessibility > Use System Colors 확인
- 기기 설정에서 다크모드 활성화 확인

### 3. 타입 에러

**해결:**
```bash
npx tsc --noEmit
npm install --save-dev @types/react-native
```

### 4. 디자인 토큰 타입이 누락됨

**해결:**
```bash
# 토큰 파일의 내보내기 확인
cat design-system/tokens/index.ts

# 필요시 인덱스 파일 업데이트
export * from './colors';
export * from './spacing';
export * from './typography';
```

---

## 모범 사례

### 1. 색상 토큰 사용

```tsx
// 나쁜 예
<Text style={{ color: '#3B82F6' }}>Text</Text>

// 좋은 예
import { colors } from '@/design-system/tokens';

<Text style={{ color: colors.primary }}>Text</Text>
```

### 2. 간격 일관성

```tsx
// 나쁜 예
<View style={{ padding: 15, margin: 10 }}>

// 좋은 예
<View className="p-md m-sm">
```

### 3. 다크모드 지원

```tsx
// 나쁜 예
<View className="bg-white">

// 좋은 예
<View className="bg-white dark:bg-gray-900">
```

### 4. 재사용 가능한 컴포넌트

```tsx
// design-system/components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  children
}: ButtonProps) {
  // 구현...
}
```

---

## 다음 단계

1. **컴포넌트 라이브러리 구축**: 버튼, 입력, 카드 등
2. **스토리북 통합**: 컴포넌트 문서화 및 테스트
3. **테마 전환 기능**: 사용자가 테마 선택 가능하도록
4. **다국어 지원**: 텍스트 토큰 추가

---

## 참고 자료

- [NativeWind Documentation](https://www.nativewind.dev/)
- [Tailwind CSS Configuration](https://tailwindcss.com/docs/configuration)
- [React Native Design Tokens](https://github.com/facebook/react-native)
- [Expo Documentation](https://docs.expo.dev/)
