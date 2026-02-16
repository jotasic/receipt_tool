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

#### 2depth 이상 화면 (탭 외부) - `/item/*`, `/report/*` 등

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
│                                          │ ← 탭 바 없음 (자동 숨김)
│                                          │ ← SafeAreaView (bottom)
└─────────────────────────────────────────┘
```

**특징:**
- 경로: `/(tabs)/*` 외부 (Stack 네비게이터 사용)
- _layout.tsx에서 Stack 네비게이터와 공통 UI 정의
- 화면 파일([id].tsx, add.tsx 등)은 콘텐츠만 반환
- 탭 바가 자동으로 숨겨집니다
- 뒤로가기 버튼이 헤더 왼쪽에 자동으로 표시됩니다
- FloatingActionBar는 _layout.tsx에서 조건부로 렌더링

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
- 증빙 목록 (`/(tabs)/items.tsx`)
- 항목 상세 (`/item/[id].tsx`)
- 리포트 목록 (`/(tabs)/reports.tsx`)
- 리포트 상세 (`/report/[id].tsx`)
- 모든 화면

---

## 화면별 적용 방법

### 1depth 탭 화면 (목록) - app/(tabs)/

**구조:**
```
app/(tabs)/
├── _layout.tsx          (Tabs + Header + FloatingActionBar)
├── index.tsx            (콘텐츠만)
└── items.tsx            (콘텐츠만)
```

**_layout.tsx 예시: 탭 레이아웃 정의**

```typescript
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';
import { FloatingActionBar } from '@/components/common';
import { useState } from 'react';

export default function TabsLayout() {
  const [currentRoute, setCurrentRoute] = useState('index');

  const getHeaderTitle = () => {
    switch (currentRoute) {
      case 'index':
        return '대시보드';
      case 'items':
        return '증빙';
      default:
        return '';
    }
  };

  const getFloatingActions = () => {
    if (currentRoute === 'items') {
      return [{ icon: 'add', onPress: handleAddItem, variant: 'primary' }];
    }
    return undefined;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Header title={getHeaderTitle()} showBack={false} />

      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          options={{ title: '대시보드' }}
          listeners={{
            tabPress: () => setCurrentRoute('index'),
          }}
        />
        <Tabs.Screen
          name="items"
          options={{ title: '증빙' }}
          listeners={{
            tabPress: () => setCurrentRoute('items'),
          }}
        />
      </Tabs>

      {/* 공통 FloatingActionBar (경로별로 조건부 렌더링) */}
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
```

**화면 파일 예시: app/(tabs)/items.tsx (콘텐츠만)**

```typescript
import { ScrollView, View } from 'react-native';
import { ItemList } from '@/components/item/ItemList';

export default function ItemsTab() {
  return (
    <ScrollView className="flex-1">
      <ItemList />
    </ScrollView>
  );
}
```

**모달 예시: 증빙 목록 화면에서 추가 폼**

```typescript
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { ItemList } from '@/components/item/ItemList';
import { FullScreenModal } from '@/components/common';
import { ItemForm } from '@/components/item/ItemForm';

export default function ItemsTab() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <ScrollView className="flex-1">
        <ItemList />
      </ScrollView>

      <FullScreenModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="새 항목"
        rightButton={{
          label: '생성',
          onPress: handleCreate,
          disabled: !isValid,
        }}
      >
        <ItemForm />
      </FullScreenModal>
    </>
  );
}
```

---

### 2depth 이상 화면 - app/item/, app/report/ 등

**구조:**
```
app/item/
├── _layout.tsx          (Stack + Header + FloatingActionBar)
├── [id].tsx             (콘텐츠만)
└── add.tsx              (콘텐츠만)
```

**_layout.tsx 예시: Stack 레이아웃 정의**

```typescript
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';
import { FloatingActionBar } from '@/components/common';
import { usePathname } from 'expo-router';

export default function ItemLayout() {
  const pathname = usePathname();

  const getHeaderTitle = () => {
    if (pathname.includes('[id]')) {
      return '항목 상세';
    }
    if (pathname.includes('add')) {
      return '새 항목';
    }
    return '';
  };

  const getFloatingActions = () => {
    // 상세 화면에서만 수정/삭제 버튼 표시
    if (pathname.includes('[id]')) {
      return [
        { icon: 'create-outline', onPress: handleEdit, variant: 'default' },
        { icon: 'trash-outline', onPress: handleDelete, variant: 'danger' },
      ];
    }
    return undefined;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Header title={getHeaderTitle()} showBack={true} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="[id]" />
        <Stack.Screen name="add" />
      </Stack>

      {/* 공통 FloatingActionBar */}
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
```

**화면 파일 예시: app/item/[id].tsx (콘텐츠만)**

```typescript
import { ScrollView, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ItemDetail } from '@/components/item/ItemDetail';

export default function ItemDetailScreen() {
  const route = useRoute();
  const { id } = route.params as { id: string };

  return (
    <ScrollView className="flex-1 px-4 py-4">
      <ItemDetail itemId={id} />
    </ScrollView>
  );
}
```

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

### 1. _layout.tsx 생성

- [ ] 각 디렉토리에 _layout.tsx 파일 생성
- [ ] SafeAreaView로 전체 감싸기
- [ ] Stack/Tabs/Slot 네비게이터 설정
- [ ] Header 컴포넌트 추가
- [ ] FloatingActionBar 조건부 렌더링

### 2. 화면 파일 수정

- [ ] 레이아웃 컴포넌트 제거 (ScreenLayout, TabScreenLayout, ModalLayout 등)
- [ ] 콘텐츠만 반환하도록 수정
- [ ] SafeAreaView 제거 (레이아웃에서 처리)
- [ ] FloatingActionBar 제거 (레이아웃에서 처리)
- [ ] FullScreenModal은 상태 기반으로 유지

### 3. 검증

- [ ] TypeScript 컴파일 확인
- [ ] 모든 화면 네비게이션 테스트
- [ ] FloatingActionBar 위치 일관성 확인
- [ ] 다크모드 동작 확인

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
| 레이아웃 | TabScreenLayout + ScreenLayout | ScreenLayout 통일 | 탭 표시는 자동 처리 |
| 깊이별 처리 | 수동 구분 필요 | 자동 처리 | 경로에 따라 자동 결정 |
| 뒤로가기 | showBack prop | 자동 표시/숨김 | 히스토리 기반 자동 처리 |
| 모달 버튼 | bottomButtons | rightButton | 헤더 액션 버튼 사용 |
| 플로팅 버튼 | compact prop 사용 | 항상 원형 FAB | 모든 화면 동일 스타일 |
| 3depth+ | ScreenLayout | ScreenLayout | 동일한 구조 지원 |

**최종 업데이트:** 2026-02-16
