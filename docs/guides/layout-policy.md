# 레이아웃 및 모달 정책

Receipt Tool 앱의 레이아웃, 모달, 플로팅 버튼 사용 정책을 정의한 문서입니다.

이 정책은 **Expo Router의 공식 레이아웃 패턴**을 기반으로 합니다. 자세한 기술 내용은 [Expo Router 레이아웃 가이드](/docs/guides/expo-router-layout.md)를 참조하세요.

---

## 핵심 정책 요약

### 1. 레이아웃은 _layout.tsx에서만 정의

- **화면 파일은 콘텐츠만 반환** (화면 파일은 레이아웃 컴포넌트를 사용하면 안 됨)
- **레이아웃은 _layout.tsx에서 정의** (Header, SafeAreaView, FloatingActionBar, 네비게이터 등)
- 각 디렉토리의 `_layout.tsx`에서 Stack/Tabs/Slot 패턴 사용
- 공통 UI 요소는 레이아웃에서만 관리하여 일관성 보장

### 2. 추가/수정 화면은 무조건 모달

- 항목 추가/수정, 태그 추가/수정, 사용처 추가/수정 등 모든 CRUD 폼은 **FullScreenModal**을 사용합니다
- `router.push()` 방식 대신 상태로 관리하여 컨텍스트를 유지합니다

### 3. 모달은 헤더 액션 버튼만 사용

- **하단 버튼 (bottomButtons) 제거**
- 모달 헤더 구조: **왼쪽 X | 가운데 제목 | 오른쪽 액션 버튼**
- 액션 버튼: "생성", "저장", "완료" 등

### 4. 플로팅 버튼은 _layout.tsx에서 관리

- 모든 플로팅 버튼은 **원형 FAB (Floating Action Button)** 스타일로 통일
- FloatingActionBar는 _layout.tsx에서 조건부로 렌더링
- 아이콘만 표시 (텍스트 레이블 제거)
- 여러 액션 = 세로로 배치 (하단부터 역순)

---

## 레이아웃 다이어그램

### 화면 구조 (모든 화면에서 동일)

**모든 화면은 동일한 구조를 가집니다. 탭 바와 뒤로가기는 라우팅 경로에 따라 자동으로 표시/숨김됩니다.**

#### 1depth 화면 (탭 내부) - `/(tabs)/*`

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │ ← SafeAreaView (top)
│  │  제목                   [액션]     │  │ ← Header (Slot 콘텐츠 위)
│  │  (뒤로가기 없음)                   │  │
│  └───────────────────────────────────┘  │
│  ─────────────────────────────────────  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │  Slot (페이지 콘텐츠)        │ │  │ ← _layout.tsx에서
│  │  │  index.tsx 또는 items.tsx   │ │  │    Slot으로 콘텐츠 로드
│  │  └─────────────────────────────┘ │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                          │
│                              ┌────────┐  │ ← FloatingActionBar
│                              │   +    │  │    (원형 FAB)
│                              └────────┘  │
│  ─────────────────────────────────────  │
│  │   홈   │   증빙   │   캘린더   │    │  │ ← Tab Bar (자동 표시)
│  └──────┴──────────┴───────────┴────┘  │
│                                          │ ← SafeAreaView (bottom)
└─────────────────────────────────────────┘
```

**특징:**
- 경로: `/(tabs)/*` 내부
- _layout.tsx에서 Tabs 네비게이터와 공통 UI 정의
- 화면 파일(index.tsx, items.tsx 등)은 콘텐츠만 반환
- 탭 바가 자동으로 표시됩니다
- 뒤로가기 버튼 없음 (탭 바로 네비게이션)
- FloatingActionBar는 _layout.tsx에서 조건부로 렌더링

---

#### 2depth 이상 화면 (탭 내부 Stack) - `/(tabs)/index/item/*`, `/(tabs)/items/report/*` 등

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │ ← SafeAreaView (top)
│  │  [◀]  제목                [액션]   │  │ ← Header (Stack에 포함)
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  ─────────────────────────────────────  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │  Slot (페이지 콘텐츠)        │ │  │ ← _layout.tsx에서
│  │  │  [id].tsx 등                 │ │  │    Stack + Slot으로 로드
│  │  └─────────────────────────────┘ │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                   ┌───┐  │ ← FloatingActionBar
│                                   │ ✏ │  │    (원형 FAB)
│                                   ├───┤  │
│                                   │ 🗑 │  │
│                                   └───┘  │
│                                          │
│                                          │ ← 탭 바 자동 숨김 (2depth)
│                                          │ ← SafeAreaView (bottom)
└─────────────────────────────────────────┘
```

**특징:**
- 경로: `/(tabs)/{tabName}/{screenName}/*` (각 탭 내부의 Stack)
- 각 탭이 자신의 Stack을 관리하여 일관된 헤더/타이틀 유지
- 2depth 이상 화면에서는 탭 바가 자동으로 숨겨집니다
- 뒤로가기 버튼이 헤더 왼쪽에 자동으로 표시됩니다
- FloatingActionBar는 각 탭의 _layout.tsx에서 조건부로 렌더링
- 탭 전환 시 헤더가 깜빡이지 않음 (각 탭이 독립적인 네비게이션 스택 관리)

---

### Modal: FullScreenModal

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │ ← SafeAreaView (top)
│  │  [X]        제목         [저장]    │  │ ← Modal Header (56px)
│  └───────────────────────────────────┘  │
│  ─────────────────────────────────────  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │   Form Field 1              │ │  │
│  │  └─────────────────────────────┘ │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │   Form Field 2              │ │  │
│  │  └─────────────────────────────┘ │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │   Form Field 3              │ │  │
│  │  └─────────────────────────────┘ │  │
│  │                                   │  │
│  │        Form Content               │  │
│  │        (Scrollable)               │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                          │
│  (하단 버튼 없음)                         │
│                                          │ ← SafeAreaView (bottom)
└─────────────────────────────────────────┘
```

**특징:**
- 전체 화면을 차지하는 모달입니다
- 헤더 구조: **왼쪽 X | 가운데 제목 | 오른쪽 액션 버튼**
- 하단 버튼(bottomButtons)은 사용하지 않습니다
- 액션 버튼: "생성", "저장", "완료" 등
- 액션 버튼 비활성화 시: 폼 검증 실패 시 disabled 상태로 표시
- SafeAreaView는 top만 적용됩니다

**사용 예:**
- 항목 추가 (Item Form Modal)
- 태그 추가/수정 (`/settings/tags.tsx`)
- 사용처 추가/수정 (`/settings/usage-purposes.tsx`)
- 커스텀 필드 추가/수정 (`/settings/custom-fields.tsx`)

---

## 플로팅 버튼 정책

### FloatingActionBar

**모든 화면에서 동일한 FAB (Floating Action Button) 스타일 사용**

**UI:**
```
                                  ┌───┐
                                  │ + │  ← 원형 FAB (64x64)
                                  └───┘
                           오른쪽 하단 고정
```

**특징:**
- 원형 아이콘 버튼 (64x64px)
- 아이콘만 표시 (텍스트 레이블 없음)
- 배경 + 그림자 효과
- 여러 액션 = 세로로 배치 (하단부터 역순)
- 모든 화면에서 동일한 스타일
- `compact` prop 제거 - 항상 원형 FAB 스타일

**Variant:**
- `primary`: 파란색 배경 + 흰색 아이콘 (주요 액션: 추가, 제출)
- `default`: 회색 배경 + 어두운 아이콘 (일반 액션: 수정)
- `danger`: 빨간색 배경 + 빨간 아이콘 (위험 액션: 삭제)

**코드 예시:**
```typescript
<FloatingActionBar
  actions={[
    {
      icon: 'add',
      onPress: handleAdd,
      variant: 'primary',
    },
  ]}
/>

// 여러 액션
<FloatingActionBar
  actions={[
    { icon: 'create-outline', onPress: handleEdit },
    { icon: 'trash-outline', onPress: handleDelete, variant: 'danger' },
  ]}
/>
```

**적용 화면:**
- 대시보드 (`/(tabs)/index/index.tsx`) - FloatingActionBar 없음
- 증빙 목록 (`/(tabs)/items/index.tsx`) - 추가 버튼
- 항목 상세 (`/(tabs)/index/item/[id].tsx`) - 수정/삭제 버튼
- 리포트 목록 (`/(tabs)/reports/index.tsx`) - 추가 버튼
- 리포트 상세 (`/(tabs)/reports/[id].tsx`) - 수정/삭제 버튼

---

## 화면별 적용 방법

### 1depth 탭 화면 (목록) - app/(tabs)/

**구조:**
```
app/(tabs)/
├── _layout.tsx              (Tabs 상단 레이아웃)
├── index/
│   ├── _layout.tsx          (홈 탭의 Stack + Header)
│   ├── index.tsx            (대시보드 콘텐츠만)
│   └── item/
│       ├── _layout.tsx      (항목 Stack)
│       └── [id].tsx         (항목 상세 콘텐츠만)
├── items/
│   ├── _layout.tsx          (증빙 탭의 Stack + Header + FloatingActionBar)
│   ├── index.tsx            (증빙 목록 콘텐츠만)
│   └── report/
│       ├── _layout.tsx      (리포트 Stack)
│       └── [id].tsx         (리포트 상세 콘텐츠만)
└── reports/
    ├── _layout.tsx          (리포트 탭의 Stack + Header + FloatingActionBar)
    └── index.tsx            (리포트 목록 콘텐츠만)
```

**_layout.tsx 예시: 상단 Tabs 레이아웃 (app/(tabs)/_layout.tsx)**

```typescript
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,  // 각 탭의 _layout.tsx에서 Header 렌더링
        tabBarActiveTintColor: '#3B82F6',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: '증빙',
          tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: '리포트',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**_layout.tsx 예시: 탭 내부 Stack (app/(tabs)/items/_layout.tsx)**

```typescript
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';
import { FloatingActionBar } from '@/components/common';
import { usePathname } from 'expo-router';
import { useState } from 'react';

export default function ItemsTabLayout() {
  const pathname = usePathname();
  const [showAddModal, setShowAddModal] = useState(false);

  const isDetailScreen = pathname.includes('report/');

  const getHeaderTitle = () => {
    if (isDetailScreen) {
      return '리포트 상세';
    }
    return '증빙';
  };

  const getFloatingActions = () => {
    if (isDetailScreen) {
      return [
        { icon: 'create-outline', onPress: handleEdit, variant: 'default' },
        { icon: 'trash-outline', onPress: handleDelete, variant: 'danger' },
      ];
    }
    // 목록 화면에서 추가 버튼
    return [{ icon: 'add', onPress: () => setShowAddModal(true), variant: 'primary' }];
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Header title={getHeaderTitle()} showBack={isDetailScreen} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Group>
          <Stack.Screen name="report/[id]" />
        </Stack.Group>
      </Stack>

      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}

      <ItemFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
      />
    </SafeAreaView>
  );
}
```

**화면 파일 예시: app/(tabs)/items/index.tsx (콘텐츠만)**

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

**화면 파일 예시: app/(tabs)/index/index.tsx (콘텐츠만, FloatingActionBar 없음)**

```typescript
import { ScrollView } from 'react-native';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function HomeTab() {
  return (
    <ScrollView className="flex-1">
      <Dashboard />
    </ScrollView>
  );
}
```

---

### 2depth 이상 화면 - app/(tabs)/index/item/, app/(tabs)/items/report/ 등

**구조:**
```
app/(tabs)/
├── _layout.tsx          (Tabs 상단 레이아웃)
├── index/
│   ├── _layout.tsx      (홈 탭의 Stack + Header + FloatingActionBar)
│   ├── index.tsx        (대시보드 콘텐츠)
│   └── item/
│       ├── _layout.tsx  (항목 Stack)
│       └── [id].tsx     (항목 상세 콘텐츠)
└── items/
    ├── _layout.tsx      (증빙 탭의 Stack + Header + FloatingActionBar)
    ├── index.tsx        (증빙 목록 콘텐츠)
    └── report/
        ├── _layout.tsx  (리포트 Stack)
        └── [id].tsx     (리포트 상세 콘텐츠)
```

**_layout.tsx 예시: 탭 내부 Stack (app/(tabs)/index/_layout.tsx)**

```typescript
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';
import { FloatingActionBar } from '@/components/common';
import { usePathname } from 'expo-router';
import { useState } from 'react';

export default function HomeTabLayout() {
  const pathname = usePathname();
  const [showAddModal, setShowAddModal] = useState(false);

  const isDetailScreen = pathname.includes('item/');

  const getHeaderTitle = () => {
    if (isDetailScreen) {
      return '항목 상세';  // Stack 화면
    }
    return '대시보드';     // 홈 탭 기본 화면
  };

  const getFloatingActions = () => {
    // 상세 화면에서만 수정/삭제 버튼 표시
    if (isDetailScreen) {
      return [
        { icon: 'create-outline', onPress: handleEdit, variant: 'default' },
        { icon: 'trash-outline', onPress: handleDelete, variant: 'danger' },
      ];
    }
    // 홈 탭 기본 화면에서는 버튼 없음
    return undefined;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Header title={getHeaderTitle()} showBack={isDetailScreen} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Group screenOptions={{ presentation: 'default' }}>
          <Stack.Screen name="item/[id]" />
        </Stack.Group>
      </Stack>

      {/* 공통 FloatingActionBar */}
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}

      {/* 항목 추가 모달 (홈 탭 레이아웃에서 관리) */}
      <ItemFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
      />
    </SafeAreaView>
  );
}
```

**화면 파일 예시: app/(tabs)/index/item/[id].tsx (콘텐츠만)**

```typescript
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ItemDetail } from '@/components/item/ItemDetail';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView className="flex-1 px-4 py-4">
      <ItemDetail itemId={id!} />
    </ScrollView>
  );
}
```

**중요: 탭별 독립적인 Stack**

각 탭 (`index`, `items`, `reports`)이 자신의 2depth 화면을 독립적으로 관리합니다. 이렇게 하면:
- 탭 전환 시 헤더가 깜빡이지 않음
- 각 탭의 히스토리가 분리됨
- 뒤로가기 시 같은 탭 내에서만 이동

---

### 모달 폼 화면

**컴포넌트:** `FullScreenModal`

**예시: 태그 추가 모달**

```typescript
import { useState } from 'react';
import { FullScreenModal } from '@/components/common';
import { View, TextInput } from 'react-native';
import { IconPicker } from '@/components/common';

interface TagFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TagData) => void;
}

export function TagFormModal({ visible, onClose, onSubmit }: TagFormModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('pricetag');

  const handleSubmit = () => {
    onSubmit({ name, icon });
    onClose();
  };

  const isValid = name.trim().length > 0;

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      title="새 태그"
      rightButton={{
        label: '생성',
        onPress: handleSubmit,
        disabled: !isValid,
      }}
    >
      <View className="p-4 gap-4">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="태그 이름"
          className="border border-gray-300 rounded-lg p-3"
        />
        <IconPicker
          selectedIcon={icon}
          onSelectIcon={setIcon}
        />
      </View>
    </FullScreenModal>
  );
}
```

---

## 구현 원칙

### _layout.tsx 활용

1. **레이아웃 정의 위치:**
   - Header, SafeAreaView, FloatingActionBar: _layout.tsx에서만
   - Stack/Tabs/Slot 네비게이터: _layout.tsx에서만
   - 공통 UI 요소: _layout.tsx에서만

2. **화면 파일의 책임:**
   - 콘텐츠만 반환 (View, ScrollView, Text 등)
   - 레이아웃 컴포넌트 사용 금지
   - FullScreenModal은 사용 가능 (레이아웃이 아니라 modal 상태)

3. **FloatingActionBar 관리:**
   - _layout.tsx에서 라우트/경로에 따라 조건부 렌더링
   - 각 화면 파일에서 개별로 관리하지 않음
   - 위치 일관성 보장

### 컴포넌트 사용 정책

| 컴포넌트 | 용도 | 위치 |
|---------|-----|------|
| **FullScreenModal** | 추가/수정/삭제 폼 | 화면 파일에서 상태로 관리 |
| **FloatingActionBar** | 주요 액션 버튼 | _layout.tsx에서 렌더링 |
| **Header** | 화면 제목, 액션 | _layout.tsx에서 렌더링 |
| **SafeAreaView** | 안전 영역 처리 | _layout.tsx에서 감싸기 |
| **Tabs/Stack/Slot** | 네비게이션 | _layout.tsx에서 사용 |

---

## 마이그레이션 체크리스트

기존 패턴에서 새 패턴으로 전환할 때:

### 1. 탭별 Stack 구조 생성

- [ ] 각 탭 디렉토리에 `_layout.tsx` 생성 (`app/(tabs)/index/_layout.tsx`, `app/(tabs)/items/_layout.tsx` 등)
- [ ] 각 탭의 2depth 화면을 해당 탭의 Stack에서 관리 (`app/(tabs)/index/item/[id].tsx` 등)
- [ ] Root의 `app/item/`, `app/report/` 폴더 제거

### 2. _layout.tsx 구성

- [ ] 상단 Tabs 레이아웃: `app/(tabs)/_layout.tsx` (Tabs만 정의)
- [ ] 각 탭 Stack 레이아웃: `app/(tabs)/{tabName}/_layout.tsx` (Header + Stack + FloatingActionBar)
- [ ] SafeAreaView로 전체 감싸기
- [ ] Header 컴포넌트 추가
- [ ] FloatingActionBar 조건부 렌더링

### 3. 화면 파일 수정

- [ ] 레이아웃 컴포넌트 제거 (ScreenLayout, TabScreenLayout 등)
- [ ] 콘텐츠만 반환하도록 수정
- [ ] SafeAreaView 제거 (레이아웃에서 처리)
- [ ] FloatingActionBar 제거 (레이아웃에서 처리)
- [ ] FullScreenModal은 각 탭의 _layout.tsx에서 상태 관리

### 4. 라우팅 수정

- [ ] 라우트 경로 업데이트 (예: `/item/[id]` → `/(tabs)/index/item/[id]`)
- [ ] `useLocalSearchParams` 사용 (useRoute 대신)
- [ ] 각 탭 내에서 `router.push` 경로 확인

### 5. 검증

- [ ] TypeScript 컴파일 확인
- [ ] 모든 화면 네비게이션 테스트
- [ ] 탭 전환 시 헤더 깜빡임 제거 확인
- [ ] FloatingActionBar 위치 일관성 확인
- [ ] 다크모드 동작 확인
- [ ] 뒤로가기 제스처 정상 동작 확인

---

### 기존 코드 마이그레이션

#### TabScreenLayout → ScreenLayout

**변경 전:**
```typescript
import { TabScreenLayout } from '@/design-system/layouts';

<TabScreenLayout title="증빙">
  <ItemList />
</TabScreenLayout>
```

**변경 후:**
```typescript
import { ScreenLayout } from '@/design-system/layouts';

<ScreenLayout title="증빙">
  <ItemList />
</ScreenLayout>
```

---

#### showHeader, showBack 속성 제거

**변경 전:**
```typescript
<ScreenLayout title="항목 상세" showHeader showBack>
  <ItemDetail />
</ScreenLayout>
```

**변경 후:**
```typescript
<ScreenLayout title="항목 상세">
  <ItemDetail />
</ScreenLayout>
```

---

#### bottomButtons → rightButton

**변경 전:**
```typescript
<FullScreenModal
  visible={visible}
  onClose={onClose}
  title="새 항목"
  bottomButtons={[
    { label: '취소', variant: 'secondary', onPress: onClose },
    { label: '생성', variant: 'primary', onPress: handleCreate },
  ]}
>
  <ItemForm />
</FullScreenModal>
```

**변경 후:**
```typescript
<FullScreenModal
  visible={visible}
  onClose={onClose}
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

취소는 헤더 왼쪽의 X 버튼으로 처리됩니다.

---

## 체크리스트

### 정책 준수 체크리스트

새 화면을 구현할 때 다음 항목을 확인하세요.

#### 레이아웃 선택

- [ ] 모든 화면에서 `ScreenLayout` 사용
- [ ] 1depth (탭 내부)에서 탭 바가 자동으로 표시되는지 확인
- [ ] 2depth+ (탭 외부)에서 탭 바가 자동으로 숨겨지는지 확인
- [ ] 뒤로가기 버튼이 경로에 따라 자동으로 표시/숨겨지는지 확인

#### 추가/수정 폼

- [ ] 추가/수정 폼은 `FullScreenModal` 사용
- [ ] 모달 헤더 구조: **왼쪽 X | 가운데 제목 | 오른쪽 액션 버튼**
- [ ] `bottomButtons` 사용하지 않음
- [ ] 액션 버튼: "생성", "저장", "완료" 등 명확한 레이블
- [ ] 폼 검증 실패 시 액션 버튼 disabled 상태

#### 플로팅 버튼

- [ ] 모든 화면에서 FAB 스타일 `FloatingActionBar` 사용 (원형 아이콘)
- [ ] 아이콘만 표시 (텍스트 레이블 없음)
- [ ] 플로팅 버튼 위치: 오른쪽 하단 고정
- [ ] 여러 액션은 세로로 배치 (하단부터 역순)
- [ ] variant 스타일 적용 (primary, default, danger)

#### 액션 버튼

- [ ] 상세 페이지에서 수정/삭제 액션은 `FloatingActionBar` 사용
- [ ] 액션 버튼은 variant 스타일 적용 (default, danger, primary)

---

## 관련 문서

- [Design System Guide](./design-system.md) - 디자인 시스템 사용 가이드
- [Design System Architecture](../architecture/design-system.md) - 구조 및 확장 방법
- [Architecture](../architecture.md) - 프로젝트 아키텍처

---

## 참고 사항

### 왜 모달을 사용하나?

1. **컨텍스트 유지:** 사용자가 현재 보고 있던 목록을 유지하면서 폼 작성
2. **빠른 네비게이션:** 뒤로가기 제스처로 쉽게 닫기
3. **시각적 계층:** 모달이 현재 화면 위에 떠 있어 임시 작업임을 명확히 전달
4. **상태 관리 간소화:** 별도 라우팅 없이 컴포넌트 상태로 관리

### 왜 하단 버튼을 제거했나?

1. **공간 효율성:** 하단 버튼이 소프트키/제스처 영역과 겹침
2. **일관성:** 헤더 액션 버튼 하나로 통일
3. **접근성:** 헤더 액션 버튼이 폼 작성 중에도 항상 보임
4. **단순성:** 취소 (X) / 확인 (액션 버튼) 구조로 명확

### 왜 플로팅 버튼을 사용하나?

1. **시각적 우선순위:** 주요 액션을 화면 상단 헤더가 아닌 접근하기 쉬운 하단에 배치
2. **엄지 도달성:** 한 손으로 조작 시 오른쪽 하단이 가장 접근하기 쉬움
3. **컨텐츠 우선:** 헤더를 간결하게 유지하여 컨텐츠에 집중
4. **모바일 UX 표준:** 대부분의 모바일 앱에서 사용하는 패턴

---

---

## 요약: 레이아웃 정책 변화

| 항목 | 이전 | 현재 | 설명 |
|-----|-----|-----|-----|
| 2depth 화면 위치 | Root에 `/item/`, `/report/` | 각 탭 내부 (`/(tabs)/{tab}/item/`) | 탭별 독립적 Stack 관리 |
| 헤더 깜빡임 | 있음 (Root Stack 전환) | 없음 (탭 내부 Stack) | 각 탭이 자신의 히스토리 유지 |
| 라우팅 | `router.push('/item/[id]')` | `router.push('item/[id]')` 또는 상대 경로 | 탭 내부에서만 네비게이션 |
| 뒤로가기 | Root Stack에서 처리 | 각 탭 Stack에서 처리 | 탭 전환 후에도 같은 화면 유지 |
| FloatingActionBar | 각 화면마다 개별 관리 | 각 탭의 _layout.tsx에서 관리 | 위치 일관성 보장 |
| 모달 관리 | 화면 파일에서 | 탭의 _layout.tsx에서 | 모달이 탭과 동일한 레이아웃 공유 |

**최종 업데이트:** 2026-02-17

## 구조 변경의 이점

### 1. 헤더 깜빡임 제거
- 이전: Root Stack에서 `/item/[id]` 전환 시 Root Header와 Item Header가 겹침
- 현재: 각 탭이 자신의 Header를 관리하여 일관된 레이아웃 유지

### 2. 탭별 히스토리 독립성
- 이전: 모든 탭이 Root 히스토리를 공유하여 뒤로가기 시 다른 탭으로 이동 가능
- 현재: 각 탭이 자신의 히스토리를 관리하여 탭별로 독립적 네비게이션

### 3. 라우팅 단순화
- 이전: 절대 경로로 타 탭 화면 접근 가능
- 현재: 각 탭 내에서만 네비게이션하도록 강제 (의도하지 않은 이동 방지)
