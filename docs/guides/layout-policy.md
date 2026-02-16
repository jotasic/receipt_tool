# 레이아웃 및 모달 정책

Receipt Tool 앱의 레이아웃, 모달, 플로팅 버튼 사용 정책을 정의한 문서입니다.

---

## 핵심 정책 요약

### 1. 추가/수정 화면은 무조건 모달

- 항목 추가/수정, 태그 추가/수정, 사용처 추가/수정 등 모든 CRUD 폼은 **FullScreenModal**을 사용합니다
- `router.push()` 방식 대신 `Modal` 상태로 관리하여 컨텍스트를 유지합니다

### 2. 모달은 헤더 액션 버튼만 사용

- **하단 버튼 (bottomButtons) 제거**
- 모달 헤더 구조: **왼쪽 X | 가운데 제목 | 오른쪽 액션 버튼**
- 액션 버튼: "생성", "저장", "완료" 등

### 3. 모든 화면은 ScreenLayout 사용 (탭 표시 자동)

- **1depth/2depth/3depth 모두 동일한 `ScreenLayout` 구조** 사용
- 탭 바는 라우팅 경로에 따라 자동으로 표시/숨김
  - 탭 내부 (/(tabs)/*): 탭 바 자동 표시
  - 탭 외부: 탭 바 자동 숨김
- 뒤로가기는 라우팅 히스토리에 따라 자동으로 표시/숨김

### 4. 모든 화면에서 동일한 FAB 스타일 사용

- 모든 플로팅 버튼은 **원형 FAB (Floating Action Button)** 스타일로 통일
- 아이콘만 표시 (텍스트 레이블 제거)
- 여러 액션 = 세로로 배치 (하단부터 역순)

---

## 레이아웃 다이어그램

### ScreenLayout 기본 구조

**모든 화면이 동일한 ScreenLayout을 사용합니다. 탭 바와 뒤로가기는 라우팅에 따라 자동으로 표시됩니다.**

#### 1depth 화면 (탭 내부)

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │ ← SafeAreaView (top)
│  │  제목                   [액션]     │  │ ← Header (56px)
│  │  (뒤로가기 없음)                   │  │    1depth는 뒤로가기 X
│  └───────────────────────────────────┘  │
│  ─────────────────────────────────────  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │                                   │  │
│  │        Content Area               │  │
│  │        (Scrollable)               │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                          │
│                              ┌────────┐  │ ← FloatingActionBar
│                              │   +    │  │    (원형 FAB)
│                              └────────┘  │    오른쪽 하단 고정
│  ─────────────────────────────────────  │
│  │   홈   │   증빙   │   캘린더   │    │  │ ← Tab Bar (자동 표시)
│  └──────┴──────────┴───────────┴────┘  │
│                                          │ ← SafeAreaView (bottom)
└─────────────────────────────────────────┘
```

**특징:**
- 경로: `/(tabs)/*` 내부
- 탭 바가 화면 하단에 자동으로 표시됩니다
- 뒤로가기 버튼 없음 (탭 바로 네비게이션)
- 플로팅 버튼은 탭 바 위에 배치됩니다
- SafeAreaView는 top, bottom 모두 적용됩니다

**사용 예:**
- 홈 탭 (`/(tabs)/index.tsx`)
- 증빙 탭 (`/(tabs)/items.tsx`)
- 캘린더 탭 (`/(tabs)/calendar.tsx`)
- 리포트 탭 (`/(tabs)/reports.tsx`)
- 설정 탭 (`/(tabs)/settings.tsx`)

---

#### 2depth 이상 화면 (탭 외부)

```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │ ← SafeAreaView (top)
│  │  [◀]  제목                [액션]   │  │ ← Header (56px)
│  │                                   │  │    2depth+는 뒤로가기 표시
│  └───────────────────────────────────┘  │
│  ─────────────────────────────────────  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │                                   │  │
│  │        Content Area               │  │
│  │        (Scrollable)               │  │
│  │                                   │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                   ┌───┐  │ ← FloatingActionBar
│                                   │ ✏ │  │    (원형 FAB)
│                                   ├───┤  │    오른쪽 하단 고정
│                                   │ 🗑 │  │
│                                   └───┘  │
│                                          │
│                                          │ ← 탭 바 없음 (자동 숨김)
│                                          │ ← SafeAreaView (bottom)
└─────────────────────────────────────────┘
```

**특징:**
- 경로: `/(tabs)/*` 외부 (stack navigator)
- 탭 바가 자동으로 숨겨집니다
- 뒤로가기 버튼이 헤더 왼쪽에 자동으로 표시됩니다
- 라우팅 히스토리가 있으면 뒤로가기 활성화
- 플로팅 버튼은 항상 원형 FAB 스타일을 사용합니다
- SafeAreaView는 top, bottom 모두 적용됩니다

**사용 예:**
- 항목 상세 (`/item/[id].tsx`) - 2depth
- 리포트 상세 (`/report/[id].tsx`) - 2depth
- 설정 하위 화면 (`/settings/tags.tsx`) - 2depth
- 더 깊은 수준도 동일한 구조 사용 (3depth, 4depth 등)

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

### 1depth 탭 화면 (목록)

**레이아웃:** `ScreenLayout` (탭 내부 경로)

**경로:** `/(tabs)/items.tsx`

**특징:**
- 탭 바가 자동으로 표시
- 뒤로가기 버튼 없음
- FAB 스타일 플로팅 버튼 사용

**예시: 증빙 목록 화면**

```typescript
import { useState } from 'react';
import { ScreenLayout } from '@/design-system/layouts';
import { FloatingActionBar } from '@/components/common';
import { FullScreenModal } from '@/components/common';
import { ItemForm } from '@/components/item/ItemForm';

export default function ItemsTab() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <ScreenLayout title="증빙">
        <ItemList />
      </ScreenLayout>

      {/* 플로팅 추가 버튼 */}
      <FloatingActionBar
        actions={[
          {
            icon: 'add',
            onPress: () => setShowAddModal(true),
            variant: 'primary',
          },
        ]}
      />

      {/* 추가 모달 */}
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

### 2depth 상세 화면

**레이아웃:** `ScreenLayout` (탭 외부 경로)

**경로:** `/item/[id].tsx`

**특징:**
- 탭 바가 자동으로 숨겨짐
- 뒤로가기 버튼이 자동으로 표시
- FAB 스타일 플로팅 버튼 사용

**예시: 항목 상세 화면**

```typescript
import { useState } from 'react';
import { ScreenLayout } from '@/design-system/layouts';
import { FloatingActionBar } from '@/components/common';
import { FullScreenModal } from '@/components/common';
import { ItemForm } from '@/components/item/ItemForm';

export default function ItemDetailScreen() {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <ScreenLayout title="항목 상세">
        <ItemDetail item={item} />
      </ScreenLayout>

      {/* 플로팅 액션 버튼 */}
      <FloatingActionBar
        actions={[
          {
            icon: 'create-outline',
            onPress: () => setShowEditModal(true),
            variant: 'default',
          },
          {
            icon: 'trash-outline',
            onPress: handleDelete,
            variant: 'danger',
          },
        ]}
      />

      {/* 수정 모달 */}
      <FullScreenModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="항목 수정"
        rightButton={{
          label: '저장',
          onPress: handleSave,
          disabled: !isValid,
          loading: isSaving,
        }}
      >
        <ItemForm item={item} />
      </FullScreenModal>
    </>
  );
}
```

**참고:** `showHeader`, `showBack` 속성을 제거합니다. 뒤로가기는 라우팅 히스토리에 따라 자동으로 표시됩니다.

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

## 구현 변경 사항

### 현재 상태 분석

현재 프로젝트에는 다음과 같은 컴포넌트가 존재합니다.

1. **FullScreenModal** (`components/common/FullScreenModal.tsx`)
   - ✅ 헤더 구조: 왼쪽 X | 가운데 제목 | 오른쪽 액션 버튼
   - ⚠️ `bottomButtons` 속성이 여전히 존재함 (제거 필요)

2. **ModalLayout** (`design-system/layouts/ModalLayout.tsx`)
   - ⚠️ 구형 레이아웃 (Header 컴포넌트 사용)
   - ⚠️ `bottomButtons` 사용 중
   - ❌ 사용 중단 예정

3. **FloatingActionBar** (`components/common/FloatingActionBar.tsx`)
   - ✅ 항상 원형 FAB 스타일 (compact prop 제거)
   - ✅ variant 스타일 지원
   - ✅ 정책에 부합

4. **플로팅 추가 버튼** 미구현
   - ❌ FloatingActionButton 컴포넌트 없음
   - ❌ 1depth 화면에서 플로팅 추가 버튼 미사용

---

### 레이아웃 정책 이해하기

#### ScreenLayout이 자동으로 처리하는 것

`ScreenLayout`을 사용하면 다음 항목이 **자동으로 처리**됩니다:

1. **탭 바 표시/숨김:**
   - `/(tabs)/*` 경로 내부: 탭 바 자동 표시
   - 그 외 경로: 탭 바 자동 숨김

2. **뒤로가기 버튼:**
   - 라우팅 히스토리가 있으면: 뒤로가기 버튼 자동 표시
   - 라우팅 히스토리가 없으면: 뒤로가기 버튼 자동 숨김

3. **SafeAreaView:**
   - 플랫폼 (Android/iOS) 차이 자동 처리
   - notch, 소프트키, 제스처 영역 자동 회피

#### 더 이상 필요 없는 것

다음 속성/컴포넌트들은 더 이상 사용하지 않습니다:
- `showHeader` prop: 제거 (title 설정 시 자동으로 헤더 표시)
- `showBack` prop: 제거 (경로에 따라 자동으로 뒤로가기 표시)
- `TabScreenLayout`: 제거 (모든 화면에서 ScreenLayout 사용)
- `ModalLayout`: 제거 (FullScreenModal 사용)
- `bottomButtons`: 제거 (FullScreenModal의 rightButton만 사용)

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
