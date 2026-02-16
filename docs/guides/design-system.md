# 디자인 시스템 가이드

디자인 시스템을 통해 일관된 UI를 구현합니다. 토큰, 레이아웃 컴포넌트, 훅을 조합하여 사용합니다.

## CRITICAL: 다크모드 필수 준수

**모든 UI 컴포넌트는 다크모드를 완벽히 지원해야 합니다. 이것은 선택이 아닌 필수 요구사항입니다.**

### 필수 규칙 (어기면 안 됨)

1. **색상은 항상 라이트/다크 모드 둘 다 정의**
   - NativeWind `dark:` 클래스 사용 (권장)
   - 또는 `useThemeColor()`, `useThemedStyles()` 훅 사용

2. **하드코딩 색상 절대 금지 (MUST NOT)**
   ```typescript
   // ❌ 절대 금지
   color="#XXXXXX"
   backgroundColor: '#XXXXXX'
   borderColor: '#XXXXXX'
   shadowColor: '#000000'

   // ✅ 필수
   className="text-gray-900 dark:text-gray-100"
   const textColor = useThemeColor('#1F2937', '#F3F4F6');
   ```

3. **기존 코드 수정 시 다크모드 확인 필수**
   - 색상 변경 시 라이트/다크 모드 둘 다 검증
   - 새 색상 추가 시 다크 모드 정의 필수
   - 부분 수정도 전체 컴포넌트 다크모드 검증 필수

### 자주 놓치는 부분 (체크리스트)

- [ ] Ionicons, Feather 등 color prop (useThemeColor 사용)
- [ ] ActivityIndicator color prop
- [ ] TextInput placeholder 색상 (placeholderTextColor 속성)
- [ ] border 색상 (dark:border-gray-700)
- [ ] shadow 색상 (다크모드에서 더 진하게)
- [ ] Background 그라디언트
- [ ] Alert 메시지 배경색
- [ ] Loading spinner 색상
- [ ] disabled 상태 색상

### 검증 방법 (필수)

**커밋하기 전에 반드시 확인:**

1. **코드 리뷰**: 파일의 모든 색상이 dark: 클래스 또는 훅으로 정의되어 있는가?
   ```bash
   # 하드코딩 색상 검색 (이 명령어의 결과가 0이어야 함)
   grep -r "color=['\"]#" src/ | grep -v dark: | wc -l
   grep -r "backgroundColor:[[:space:]]*['\"]#" src/ | grep -v dark: | wc -l
   ```

2. **시각적 테스트**:
   - 라이트 모드에서 모든 텍스트/아이콘 가독성 확인
   - 다크 모드로 토글 (Android 설정 > 디스플레이 > 테마)
   - 모든 텍스트/아이콘 가독성 재확인
   - 대비(contrast)가 충분한가?

3. **도구 사용**:
   ```bash
   # TypeScript 타입 체크
   npx tsc --noEmit

   # 리스트 검색 (더 정확함)
   grep -r 'color:.*"#\|color:.*'"'"'#' src/
   ```

**다크모드 미지원 커밋은 절대 금지됩니다.**

## 디자인 토큰

### 색상 (Colors)

기본 색상 팔레트는 `design-system/tokens/colors.ts`에 정의되어 있습니다.

#### 임포트

```typescript
import { colors } from '@/design-system/tokens';
```

#### 기본 의미 색상

```typescript
// 원본 색상
colors.primary        // '#3B82F6' - 파란색
colors.secondary      // '#6B7280' - 회색
colors.success        // '#10B981' - 초록색
colors.warning        // '#F59E0B' - 주황색
colors.error          // '#EF4444' - 빨간색
```

#### 분류 색상 (Classification)

증빙 분류별 색상입니다.

```typescript
colors.classification.corporateCard  // '#10B981' - 법인카드 (초록)
colors.classification.personalCard   // '#3B82F6' - 개인카드 (파란)
colors.classification.proofDocument  // '#8B5CF6' - 증명 (보라)
```

#### 사용 목적 색상 (UsagePurpose)

```typescript
colors.usagePurpose.meal   // '#FF6B6B' - 식대 (빨강)
colors.usagePurpose.other  // '#C7CEEA' - 기타 (보라)
```

#### 라이트/다크 모드 색상

```typescript
// 라이트 모드
colors.light.background           // '#F9FAFB'
colors.light.surface              // '#FFFFFF'
colors.light.border               // '#E5E7EB'
colors.light.text.primary         // '#111827'
colors.light.text.secondary       // '#6B7280'
colors.light.text.muted           // '#9CA3AF'

// 다크 모드
colors.dark.background            // '#111827'
colors.dark.surface               // '#1F2937'
colors.dark.border                // '#374151'
colors.dark.text.primary          // '#F9FAFB'
colors.dark.text.secondary        // '#D1D5DB'
colors.dark.text.muted            // '#9CA3AF'
```

#### 예시: 분류별 배지 색상 표시

```typescript
import { View, Text } from 'react-native';
import { colors } from '@/design-system/tokens';

function ClassificationBadge({ classification }: { classification: string }) {
  const bgColor = colors.classification[classification as keyof typeof colors.classification];

  return (
    <View style={{ backgroundColor: bgColor, borderRadius: 8, padding: 8 }}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>
        {classification}
      </Text>
    </View>
  );
}
```

### 간격 (Spacing)

마진, 패딩, 갭에 사용하는 스케일입니다.

```typescript
import { spacing } from '@/design-system/tokens';

spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 16px  ← 기본값
spacing.lg    // 24px
spacing.xl    // 32px
spacing.'2xl' // 40px
spacing.'3xl' // 48px
```

#### NativeWind 클래스 사용 (권장)

```typescript
// px-16은 spacing.md (16px)에 해당
<View className="px-4 py-2 gap-3">
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</View>
```

### 경계 반경 (Border Radius)

```typescript
import { borderRadius } from '@/design-system/tokens';

borderRadius.sm    // 4px
borderRadius.md    // 8px
borderRadius.lg    // 12px
borderRadius.xl    // 16px
borderRadius.full  // 9999px (완전 원)
```

### 타이포그래피 (Typography)

#### 폰트 크기

```typescript
import { fontSize } from '@/design-system/tokens';

fontSize.xs    // 12px
fontSize.sm    // 14px
fontSize.md    // 16px
fontSize.lg    // 18px
fontSize.xl    // 24px
fontSize.'2xl' // 32px
fontSize.'3xl' // 40px
```

#### 폰트 굵기

```typescript
import { fontWeight } from '@/design-system/tokens';

fontWeight.regular   // '400'
fontWeight.medium    // '500'
fontWeight.semibold  // '600'
fontWeight.bold      // '700'
```

#### 라인 높이

```typescript
import { lineHeight } from '@/design-system/tokens';

lineHeight.tight    // 1.2
lineHeight.normal   // 1.5
lineHeight.relaxed  // 1.75
```

#### 글자 간격

```typescript
import { letterSpacing } from '@/design-system/tokens';

letterSpacing.tight  // -0.5px
letterSpacing.normal // 0px
letterSpacing.wide   // 0.5px
```

#### 예시: 타이틀과 설명 텍스트

```typescript
import { StyleSheet, View, Text } from 'react-native';
import { fontSize, fontWeight, lineHeight } from '@/design-system/tokens';

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.lg * lineHeight.tight,
  },
  description: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.relaxed,
  },
});

export function ItemCard() {
  return (
    <View>
      <Text style={styles.title}>증빙 제목</Text>
      <Text style={styles.description}>증빙 설명</Text>
    </View>
  );
}
```

## 레이아웃 컴포넌트

### 핵심 원칙

**Expo Router의 공식 패턴을 따릅니다.**

레이아웃은 `_layout.tsx` 파일에서만 정의하고, 화면 파일은 콘텐츠만 반환합니다.

| 파일 유형 | 역할 |
|----------|------|
| **_layout.tsx** | Header, SafeAreaView, Stack/Tabs/Slot, FloatingActionBar 정의 |
| **화면 파일** | 콘텐츠만 반환 (View, ScrollView, Text 등) |

**관련 문서:** [Expo Router 레이아웃 가이드](/docs/guides/expo-router-layout.md)에서 자세한 기술 내용 확인

---

### 구조 예시

#### 탭 화면 레이아웃 (app/(tabs)/_layout.tsx)

```typescript
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';
import { FloatingActionBar } from '@/components/common';
import { usePathname } from 'expo-router';

export default function TabsLayout() {
  const pathname = usePathname();

  const getHeaderTitle = () => {
    if (pathname === '/') return '대시보드';
    if (pathname === '/items') return '증빙';
    return '';
  };

  const getFloatingActions = () => {
    if (pathname === '/items') {
      return [{ icon: 'add', onPress: handleAddItem, variant: 'primary' }];
    }
    return undefined;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Header title={getHeaderTitle()} showBack={false} />

      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: '대시보드' }} />
        <Tabs.Screen name="items" options={{ title: '증빙' }} />
      </Tabs>

      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
```

#### 화면 파일 (app/(tabs)/items.tsx)

```typescript
import { ScrollView } from 'react-native';
import { ItemList } from '@/components/item/ItemList';

export default function ItemsTab() {
  return (
    <ScrollView className="flex-1">
      <ItemList />
    </ScrollView>
  );
}
```

---

### FullScreenModal - 추가/수정 폼 전용

모든 추가/수정 폼에서 사용합니다. 화면 파일에서 상태로 관리합니다.

#### Props

```typescript
interface FullScreenModalProps {
  visible: boolean;            // 모달 표시 여부
  onClose: () => void;         // 닫기 핸들러 (X 버튼)
  title: string;               // 헤더 타이틀
  rightButton?: {              // 오른쪽 액션 버튼
    label: string;
    onPress: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
  };
  children: ReactNode;         // 폼 컨텐츠
}
```

#### 예시: 항목 추가 폼

```typescript
import { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { FullScreenModal } from '@/components/common';
import { createItem } from '@/services/database';

export function ItemFormModal({ visible, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = title.trim().length > 0;

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      await createItem({ title });
      onClose();
    } catch (error) {
      Alert.alert('오류', '항목 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      title="새 항목"
      rightButton={{
        label: '생성',
        onPress: handleCreate,
        disabled: !isValid,
        loading: isLoading,
      }}
    >
      <View className="p-4 gap-4">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="항목 제목"
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-3"
        />
      </View>
    </FullScreenModal>
  );
}
```

### FullScreenModal - 추가/수정 폼 전용

모든 추가/수정/삭제 확인 폼에서 사용합니다. **현재 화면 위에 모달로 열림 (새 경로 없음)**

#### Props

```typescript
interface FullScreenModalProps {
  visible: boolean;            // 모달 표시 여부
  onClose: () => void;         // 닫기 핸들러 (X 버튼)
  title: string;               // 헤더 타이틀
  rightButton?: {              // 오른쪽 액션 버튼 (생성/저장/삭제 등)
    label: string;
    onPress: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
  };
  children: ReactNode;         // 폼 컨텐츠
}
```

**특징:**
- 하단 버튼(bottomButtons) 없음
- 왼쪽: X 버튼 (닫기)
- 오른쪽: 액션 버튼 (생성/저장 등)
- SafeAreaView는 top만 적용 (소프트키 회피 완벽)

#### 예시 1: 항목 추가 폼

```typescript
import { useState } from 'react';
import { View, TextInput, Text, Alert } from 'react-native';
import { FullScreenModal } from '@/components/common';
import { createItem } from '@/services/database';

export function ItemFormModal({ visible, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = title.trim().length > 0;

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      await createItem({
        classification: 'personal_card',
        usagePurpose: 'meal',
        title,
        amount: Number(amount),
        date: new Date().toISOString().split('T')[0],
      });
      onClose();
    } catch (error) {
      Alert.alert('오류', '항목 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      title="새 항목"
      rightButton={{
        label: '생성',
        onPress: handleCreate,
        disabled: !isValid,
        loading: isLoading,
      }}
    >
      <View className="p-4 gap-4">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="항목 제목"
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white"
        />
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="금액"
          keyboardType="decimal-pad"
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white"
        />
      </View>
    </FullScreenModal>
  );
}
```

#### 예시 2: 삭제 확인 모달

```typescript
export function DeleteConfirmModal({ visible, onClose, onConfirm }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      title="삭제 확인"
      rightButton={{
        label: '삭제',
        onPress: handleDelete,
        loading: isLoading,
      }}
    >
      <View className="p-4">
        <Text className="text-gray-700 dark:text-gray-300 text-base">
          이 항목을 정말 삭제하시겠습니까?
        </Text>
      </View>
    </FullScreenModal>
  );
}
```

## 훅 사용법

### useThemeColor - 단순 색상 선택

라이트/다크 모드에 따라 색상을 자동으로 선택합니다.

```typescript
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

### useThemedStyles - 스타일시트 생성

스타일 객체를 동적으로 생성합니다. 색상 팔레트에 접근할 수 있습니다.

```typescript
import { useThemedStyles } from '@/design-system/hooks';
import { StyleSheet, View, Text } from 'react-native';

function MyComponent() {
  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    errorText: {
      color: colors.error,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>제목</Text>
        <Text style={styles.subtitle}>설명</Text>
        <Text style={styles.errorText}>에러 메시지</Text>
      </View>
    </View>
  );
}
```

#### 사용 가능한 색상 팔레트

`useThemedStyles`의 `colors` 파라미터 타입:

```typescript
interface ThemeColors {
  scheme: 'light' | 'dark';        // 현재 컬러 스킴
  background: string;              // 주 배경색
  backgroundSecondary: string;     // 보조 배경색 (카드, 엘리베이션)
  text: string;                    // 주 텍스트색
  textSecondary: string;           // 보조 텍스트색 (뮤트)
  border: string;                  // 테두리색
  primary: string;                 // 주 액센트색
  error: string;                   // 에러/위험 색
  success: string;                 // 성공 색
  warning: string;                 // 경고 색
  info: string;                    // 정보 색
}
```

### useThemeColors - 색상 팔레트 접근

스타일 객체를 만들지 않고 직접 색상에 접근합니다.

```typescript
import { useThemeColors } from '@/design-system/hooks';
import { View, Text } from 'react-native';

function MyComponent() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>
        라이트 모드에서는 검정, 다크 모드에서는 흰색
      </Text>
      <View style={{ borderColor: colors.border, borderWidth: 1 }}>
        <Text style={{ color: colors.textSecondary }}>보조 텍스트</Text>
      </View>
    </View>
  );
}
```

## 다크모드 대응

### 방법 1: NativeWind 클래스 사용 (권장)

가장 간단한 방법입니다.

```typescript
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="bg-white dark:bg-gray-900 p-4 rounded-lg">
      <Text className="text-gray-900 dark:text-white font-bold">제목</Text>
      <Text className="text-gray-600 dark:text-gray-400">설명</Text>
    </View>
  );
}
```

### 방법 2: useThemedStyles 훅 사용

복잡한 스타일이 필요할 때 사용합니다.

```typescript
import { useThemedStyles } from '@/design-system/hooks';
import { View, Text, StyleSheet } from 'react-native';

export function MyComponent() {
  const styles = useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: 1,
    },
    text: {
      color: colors.text,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>콘텐츠</Text>
    </View>
  );
}
```

### 방법 3: useThemeColor 훅 사용

고정 색상을 상황에 맞게 선택할 때 사용합니다.

```typescript
import { useThemeColor } from '@/design-system/hooks';
import { View, Text } from 'react-native';

export function MyComponent() {
  const accentColor = useThemeColor('#3B82F6', '#60A5FA');

  return (
    <View style={{ backgroundColor: accentColor }}>
      <Text style={{ color: 'white' }}>강조 영역</Text>
    </View>
  );
}
```

### 주의사항

1. **NativeWind 클래스 우선**: 대부분의 경우 `dark:` 클래스로 충분합니다
2. **StyledSheet 재계산**: 색상 스킴이 변경되면 자동으로 스타일이 재계산됩니다
3. **성능 최적화**: 컴포넌트가 자주 렌더링되지 않으면 `useThemedStyles`로 충분합니다

## 실제 예제

### 증빙 카드 컴포넌트

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColor, useThemedStyles } from '@/design-system/hooks';
import { colors } from '@/design-system/tokens';

interface ItemCardProps {
  title: string;
  classification: 'corporate_card' | 'personal_card' | 'proof_document';
  amount?: number;
  onPress: () => void;
}

export function ItemCard({
  title,
  classification,
  amount,
  onPress,
}: ItemCardProps) {
  // 배지의 텍스트 색상 (항상 흰색 또는 밝은색)
  const badgeTextColor = useThemeColor('#FFFFFF', '#F9FAFB');

  const styles = useThemedStyles((themeColors) => ({
    container: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      backgroundColor: themeColors.backgroundSecondary,
      borderColor: themeColors.border,
      borderWidth: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    classificationBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      flex: 1,
    },
    amount: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.textSecondary,
      marginTop: 4,
    },
  }));

  const classificationColor =
    colors.classification[classification as keyof typeof colors.classification];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View
          style={[
            styles.classificationBadge,
            { backgroundColor: classificationColor },
          ]}
        >
          <Text style={{ color: badgeTextColor, fontSize: 12, fontWeight: '500' }}>
            {classification}
          </Text>
        </View>
      </View>
      {amount !== undefined && (
        <Text style={styles.amount}>{amount.toLocaleString()}원</Text>
      )}
    </TouchableOpacity>
  );
}
```

### 리포트 폼 모달 (FullScreenModal 사용)

```typescript
import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { FullScreenModal } from '@/components/common';
import { useThemeColor, useThemedStyles } from '@/design-system/hooks';

export function CreateReportModal({
  visible,
  onClose
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const placeholderColor = useThemeColor('#9CA3AF', '#6B7280');

  const styles = useThemedStyles((colors) => ({
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    input: {
      borderRadius: 8,
      borderColor: colors.border,
      borderWidth: 1,
      padding: 12,
      color: colors.text,
      fontSize: 14,
    },
  }));

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      // 리포트 생성 로직
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      title="리포트 생성"
      rightButton={{
        label: '생성',
        onPress: handleSubmit,
        disabled: !title.trim(),
        loading: isLoading,
      }}
    >
      <View className="p-4 gap-4">
        <View style={styles.formGroup}>
          <Text style={styles.label}>리포트 제목</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목 입력"
            placeholderTextColor={placeholderColor}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, { minHeight: 100 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="설명 입력"
            placeholderTextColor={placeholderColor}
            multiline
          />
        </View>
      </View>
    </FullScreenModal>
  );
}
```
