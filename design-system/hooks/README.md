# Design System Hooks

다크모드를 지원하는 커스텀 React Hooks 모음

## 훅 목록

### useThemeColor

라이트/다크 모드에 따라 색상을 자동으로 선택합니다.

```tsx
import { useThemeColor } from '@/design-system/hooks';

function MyComponent() {
  const textColor = useThemeColor('#000000', '#FFFFFF');
  const bgColor = useThemeColor('#FFFFFF', '#1F2937');

  return (
    <View style={{ backgroundColor: bgColor }}>
      <Text style={{ color: textColor }}>Hello</Text>
    </View>
  );
}
```

**API**
- `useThemeColor(light: string, dark: string): string`
- `light`: 라이트 모드 색상
- `dark`: 다크 모드 색상
- 반환값: 현재 컬러 스킴에 맞는 색상

---

### useThemedStyles

StyleSheet 생성 시 다크모드를 자동으로 지원합니다.

```tsx
import { useThemedStyles } from '@/design-system/hooks';

function MyComponent() {
  const styles = useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.background,
      padding: 16,
      borderColor: colors.border,
      borderWidth: 1,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    description: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
      <Text style={styles.description}>Description</Text>
    </View>
  );
}
```

**API**
- `useThemedStyles<T>(createStyles: (colors: ThemeColors) => T): T`
- `createStyles`: ThemeColors를 받아서 스타일 객체를 반환하는 함수
- 반환값: StyleSheet 객체

**ThemeColors 인터페이스**

```typescript
interface ThemeColors {
  scheme: 'light' | 'dark';        // 현재 컬러 스킴
  background: string;               // 주 배경색
  backgroundSecondary: string;      // 보조 배경색 (카드, 패널)
  text: string;                     // 주 텍스트 색상
  textSecondary: string;            // 보조 텍스트 색상 (설명, 힌트)
  border: string;                   // 테두리 색상
  primary: string;                  // 주 액센트 색상
  error: string;                    // 에러/위험 색상
  success: string;                  // 성공 색상
  warning: string;                  // 경고 색상
  info: string;                     // 정보 색상
}
```

---

### useThemeColors

스타일 생성 없이 현재 테마 색상만 가져옵니다.

```tsx
import { useThemeColors } from '@/design-system/hooks';

function MyComponent() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
      <Text style={{ color: colors.textSecondary }}>Description</Text>
    </View>
  );
}
```

**API**
- `useThemeColors(): ThemeColors`
- 반환값: 현재 컬러 스킴에 맞는 ThemeColors 객체

---

## 사용 가이드

### NativeWind와 함께 사용

NativeWind (Tailwind CSS)를 주로 사용하되, 동적 색상이 필요한 경우 이 훅들을 사용하세요.

```tsx
import { useThemeColor } from '@/design-system/hooks';
import { Ionicons } from '@expo/vector-icons';

function MyComponent() {
  const iconColor = useThemeColor('#374151', '#D1D5DB');

  return (
    <View className="bg-white dark:bg-gray-800 p-4">
      <Ionicons name="heart" size={24} color={iconColor} />
      <Text className="text-gray-900 dark:text-gray-100">Title</Text>
    </View>
  );
}
```

### StyleSheet가 필요한 경우

NativeWind로 표현하기 어려운 스타일이나 성능 최적화가 필요한 경우 `useThemedStyles`를 사용하세요.

```tsx
import { useThemedStyles } from '@/design-system/hooks';

function MyComponent() {
  const styles = useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.background,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  }));

  return <View style={styles.container}>...</View>;
}
```

---

## 컬러 팔레트

### 라이트 모드
- `background`: #FFFFFF (white)
- `backgroundSecondary`: #F9FAFB (gray-50)
- `text`: #111827 (gray-900)
- `textSecondary`: #6B7280 (gray-500)
- `border`: #E5E7EB (gray-200)
- `primary`: #3B82F6 (blue-500)
- `error`: #EF4444 (red-500)
- `success`: #10B981 (green-500)
- `warning`: #F59E0B (amber-500)
- `info`: #06B6D4 (cyan-500)

### 다크 모드
- `background`: #111827 (gray-900)
- `backgroundSecondary`: #1F2937 (gray-800)
- `text`: #F9FAFB (gray-50)
- `textSecondary`: #9CA3AF (gray-400)
- `border`: #374151 (gray-700)
- `primary`: #3B82F6 (blue-500)
- `error`: #EF4444 (red-500)
- `success`: #10B981 (green-500)
- `warning`: #F59E0B (amber-500)
- `info`: #06B6D4 (cyan-500)

> 모든 색상은 NativeWind/Tailwind CSS 팔레트를 기반으로 합니다.
