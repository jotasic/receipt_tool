# 디자인 시스템 가이드

디자인 시스템을 통해 일관된 UI를 구현합니다. 토큰, 레이아웃 컴포넌트, 훅을 조합하여 사용합니다.

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

### ScreenLayout - 기본 화면 레이아웃

일반적인 화면(2depth 이상)에서 사용합니다.

#### Props

```typescript
interface ScreenLayoutProps {
  title?: string;              // 헤더 타이틀
  showHeader?: boolean;        // 헤더 표시 여부 (기본: false)
  showBack?: boolean;          // 뒤로가기 버튼 표시 여부 (기본: false)
  rightElement?: ReactNode;    // 헤더 오른쪽 요소
  children: ReactNode;         // 화면 컨텐츠
  scrollable?: boolean;        // 스크롤 가능 여부 (기본: true)
  edges?: readonly Edge[];     // SafeAreaView edges (기본: 모든 영역)
}
```

#### 예시 1: 헤더 없는 화면

```typescript
import { ScreenLayout } from '@/design-system/layouts';
import { View, Text } from 'react-native';

export function InitialScreen() {
  return (
    <ScreenLayout>
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">시작 화면</Text>
      </View>
    </ScreenLayout>
  );
}
```

#### 예시 2: 헤더가 있는 1depth 화면

```typescript
export function ItemListScreen() {
  return (
    <ScreenLayout showHeader title="증빙 관리">
      <ItemList />
    </ScreenLayout>
  );
}
```

#### 예시 3: 뒤로가기 버튼이 있는 2depth 화면

```typescript
export function ItemDetailScreen() {
  return (
    <ScreenLayout showHeader title="증빙 상세" showBack>
      <ItemDetail />
    </ScreenLayout>
  );
}
```

#### 예시 4: 오른쪽 버튼이 있는 화면

```typescript
import { TouchableOpacity, Text } from 'react-native';

export function ReportListScreen() {
  const handleAdd = () => {
    // 새 리포트 생성
  };

  return (
    <ScreenLayout
      showHeader
      title="리포트"
      rightElement={
        <TouchableOpacity onPress={handleAdd}>
          <Text className="text-blue-500 font-semibold">추가</Text>
        </TouchableOpacity>
      }
    >
      <ReportList />
    </ScreenLayout>
  );
}
```

### TabScreenLayout - 탭 화면 레이아웃

탭 바가 있는 1depth 화면에서만 사용합니다.

#### Props

```typescript
interface TabScreenLayoutProps {
  title: string;              // 헤더 타이틀 (필수)
  rightElement?: ReactNode;   // 헤더 오른쪽 요소
  children: ReactNode;        // 화면 컨텐츠
  scrollable?: boolean;       // 스크롤 가능 여부 (기본: true)
}
```

#### 예시

```typescript
import { TabScreenLayout } from '@/design-system/layouts';

export function ItemsTab() {
  return (
    <TabScreenLayout title="증빙">
      <ItemList />
    </TabScreenLayout>
  );
}

export function SettingsTab() {
  const handleNotificationSettings = () => {
    // 알림 설정
  };

  return (
    <TabScreenLayout
      title="설정"
      rightElement={
        <TouchableOpacity onPress={handleNotificationSettings}>
          <Text className="text-blue-500">알림</Text>
        </TouchableOpacity>
      }
    >
      <SettingsList />
    </TabScreenLayout>
  );
}
```

### ModalLayout - 모달 화면 레이아웃

모달/바텀시트 화면에서 사용합니다.

#### Props

```typescript
interface ModalButton {
  label: string;                           // 버튼 레이블
  onPress: () => void;                     // 클릭 핸들러
  variant?: 'primary' | 'secondary' | 'danger';  // 버튼 스타일
  disabled?: boolean;                      // 비활성화 여부
}

interface ModalLayoutProps {
  title: string;              // 헤더 타이틀 (필수)
  onClose?: () => void;       // 닫기 핸들러
  bottomButtons?: ModalButton[];    // 하단 버튼 배열
  children: ReactNode;        // 화면 컨텐츠
  scrollable?: boolean;       // 스크롤 가능 여부 (기본: true)
}
```

#### 예시 1: 기본 모달

```typescript
import { ModalLayout } from '@/design-system/layouts';
import { View, Text } from 'react-native';

export function ConfirmationModal() {
  const handleConfirm = () => {
    // 확인 처리
  };

  return (
    <ModalLayout
      title="확인"
      bottomButtons={[
        { label: '취소', onPress: handleCancel, variant: 'secondary' },
        { label: '확인', onPress: handleConfirm, variant: 'primary' },
      ]}
    >
      <View className="p-4">
        <Text className="text-base text-gray-700 dark:text-gray-300">
          정말 삭제하시겠습니까?
        </Text>
      </View>
    </ModalLayout>
  );
}
```

#### 예시 2: 폼이 있는 모달

```typescript
export function CreateReportModal() {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    // 리포트 생성
  };

  return (
    <ModalLayout
      title="리포트 생성"
      bottomButtons={[
        { label: '취소', onPress: handleCancel, variant: 'secondary' },
        { label: '생성', onPress: handleSubmit, variant: 'primary', disabled: !title },
      ]}
    >
      <View className="p-4 gap-4">
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          리포트 제목
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="제목 입력"
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-3"
        />
      </View>
    </ModalLayout>
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
import { useThemedStyles } from '@/design-system/hooks';
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
          <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
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

### 리포트 폼 모달

```typescript
import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { ModalLayout } from '@/design-system/layouts';
import { useThemedStyles } from '@/design-system/hooks';

export function CreateReportModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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

  const handleSubmit = () => {
    // 리포트 생성 로직
    onClose();
  };

  return (
    <ModalLayout
      title="리포트 생성"
      onClose={onClose}
      bottomButtons={[
        {
          label: '취소',
          onPress: onClose,
          variant: 'secondary',
        },
        {
          label: '생성',
          onPress: handleSubmit,
          variant: 'primary',
          disabled: !title.trim(),
        },
      ]}
    >
      <View className="p-4 gap-4">
        <View style={styles.formGroup}>
          <Text style={styles.label}>리포트 제목</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목 입력"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, { minHeight: 100 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="설명 입력"
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>
      </View>
    </ModalLayout>
  );
}
```
