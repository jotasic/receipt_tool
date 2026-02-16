# Expo Router 레이아웃 가이드

이 문서는 Expo Router의 공식 레이아웃 패턴을 기반으로 우리 프로젝트에서 레이아웃을 구성하는 방법을 설명합니다.

## 공식 문서

이 가이드는 다음 공식 문서를 기반으로 작성되었습니다:
- [Navigation layouts in Expo Router](https://docs.expo.dev/router/basics/layout/)
- [Expo Router Basics](https://docs.expo.dev/router/basics/notation/)

## 핵심 원칙

### 1. `_layout.tsx` 역할

**`_layout.tsx` 파일은 해당 디렉토리의 모든 라우트에 대한 레이아웃을 정의합니다.**

- 각 디렉토리는 하나의 `_layout.tsx`를 가질 수 있음
- 루트 `app/_layout.tsx`는 전체 앱의 진입점
- 레이아웃은 하위 페이지보다 먼저 렌더링됨

### 2. Slot 패턴

**Slot 컴포넌트는 현재 라우트의 자리 표시자(placeholder)입니다.**

```typescript
import { Slot } from 'expo-router';

export default function Layout() {
  return (
    <>
      <Header />
      <Slot />  {/* 현재 라우트가 여기에 렌더링됨 */}
      <Footer />
    </>
  );
}
```

#### Slot을 사용하는 경우

- 네비게이터 없이 레이아웃만 필요할 때
- 헤더/푸터 같은 공통 UI 추가
- 모달을 모든 라우트 위에 표시
- Stack/Tabs 네비게이터가 아닌 단순 페이지 교체

#### Stack/Tabs를 사용하는 경우

- Stack: 계층적 네비게이션 (뒤로가기)
- Tabs: 탭 바를 통한 여러 라우트 전환

### 3. 레이아웃 vs 화면 파일

공식 패턴에 따르면:

| 파일 유형 | 역할 | 포함 내용 |
|----------|------|----------|
| `_layout.tsx` | 레이아웃 정의 | Header, SafeAreaView, Stack/Tabs/Slot, FloatingActionBar 등 |
| `index.tsx`, `[id].tsx` 등 | 화면 콘텐츠만 | 페이지별 고유 콘텐츠만 (레이아웃 요소 제외) |

**잘못된 패턴 (현재 문제):**
```typescript
// app/(tabs)/index.tsx - ❌ 화면 파일에서 레이아웃 렌더링
export default function HomeScreen() {
  return (
    <TabScreenLayout title="대시보드">  {/* ❌ 레이아웃을 화면에서 렌더링 */}
      <ScrollView>
        {/* 콘텐츠 */}
      </ScrollView>
    </TabScreenLayout>
  );
}
```

**올바른 패턴:**
```typescript
// app/(tabs)/_layout.tsx - ✅ 레이아웃 파일에서 레이아웃 정의
export default function TabsLayout() {
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']}>
      <Header title="..." />
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="items" />
      </Tabs>
      <FloatingActionBar actions={...} />  {/* 공통 요소 */}
    </SafeAreaView>
  );
}

// app/(tabs)/index.tsx - ✅ 화면 파일은 콘텐츠만
export default function HomeScreen() {
  return (
    <ScrollView>
      {/* 콘텐츠만 */}
    </ScrollView>
  );
}
```

## 우리 프로젝트 구조

### 이전 구조 (문제가 있던 구조)

```
app/
├── (tabs)/
│   ├── _layout.tsx          (Tabs 네비게이터만 정의)
│   ├── index.tsx            (❌ TabScreenLayout 렌더링)
│   ├── items.tsx            (❌ TabScreenLayout 렌더링)
│   └── reports.tsx          (❌ TabScreenLayout 렌더링)
├── item/                     (❌ Root에 위치)
│   ├── _layout.tsx
│   ├── [id].tsx
│   └── add.tsx
```

**문제점:**
- Root 레벨에 `/item/`, `/report/` 같은 2depth 화면이 있어서 Root Stack이 필요
- 2depth 화면으로 이동 시 Root Header와 Item Header가 겹쳐서 깜빡임
- 각 탭의 히스토리가 공유되어 의도하지 않은 네비게이션 발생
- FloatingActionBar가 각 화면에 개별 구현

### 올바른 구조 (현재)

```
app/
├── _layout.tsx              (루트: 프로바이더 + Slot)
└── (tabs)/
    ├── _layout.tsx          (Tabs 정의)
    ├── index/
    │   ├── _layout.tsx      (홈 탭의 Stack + Header)
    │   ├── index.tsx        (대시보드 콘텐츠)
    │   └── item/
    │       ├── _layout.tsx  (항목 Stack)
    │       └── [id].tsx     (항목 상세 콘텐츠)
    ├── items/
    │   ├── _layout.tsx      (증빙 탭의 Stack + Header + FloatingActionBar)
    │   ├── index.tsx        (증빙 목록 콘텐츠)
    │   └── report/
    │       ├── _layout.tsx  (리포트 Stack)
    │       └── [id].tsx     (리포트 상세 콘텐츠)
    └── reports/
        ├── _layout.tsx      (리포트 탭의 Stack + Header + FloatingActionBar)
        └── index.tsx        (리포트 목록 콘텐츠)
```

**장점:**
- 각 탭이 자신의 2depth 화면을 관리하여 헤더 깜빡임 제거
- 각 탭의 히스토리가 독립적으로 관리됨
- 탭 전환 후에도 같은 화면 상태 유지
- 공식 Expo Router 패턴 준수 (Stack 중첩 사용)

## 구현 패턴

### 1. 루트 레이아웃 (app/_layout.tsx)

프로바이더와 전역 설정을 위한 Slot 패턴:

```typescript
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Slot />  {/* 하위 라우트가 여기에 렌더링 */}
    </SafeAreaProvider>
  );
}
```

### 2. Tabs 레이아웃 (app/(tabs)/_layout.tsx)

**상단 Tabs만 정의 (각 탭의 내부 레이아웃은 탭별 _layout.tsx에서 관리):**

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

### 2-1. 각 탭의 내부 레이아웃 (app/(tabs)/items/_layout.tsx)

**각 탭이 자신의 Stack을 관리:**

```typescript
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';
import { FloatingActionBar } from '@/components/common';
import { usePathname } from 'expo-router';

export default function ItemsTabLayout() {
  const pathname = usePathname();

  // 2depth 화면인지 확인
  const isDetailScreen = pathname.includes('report/');

  const getHeaderTitle = () => {
    return isDetailScreen ? '리포트 상세' : '증빙';
  };

  const getFloatingActions = () => {
    if (isDetailScreen) {
      return [
        { icon: 'create-outline', onPress: handleEdit, variant: 'default' },
        { icon: 'trash-outline', onPress: handleDelete, variant: 'danger' },
      ];
    }
    return [{ icon: 'add', onPress: handleAddItem, variant: 'primary' }];
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Header title={getHeaderTitle()} showBack={isDetailScreen} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="report/[id]" />
      </Stack>

      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
```

### 3. 2depth Stack 레이아웃 (app/(tabs)/index/item/_layout.tsx)

**각 탭 내부의 2depth 화면을 관리:**

```typescript
import { Stack } from 'expo-router';

export default function ItemStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
```

**주의:** SafeAreaView와 Header는 부모 탭의 _layout.tsx에서 이미 처리되었으므로 여기서는 Stack만 정의

### 4. 화면 파일 (콘텐츠만)

화면 파일은 레이아웃 요소 없이 콘텐츠만 반환:

```typescript
// app/(tabs)/items/index.tsx
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

```typescript
// app/(tabs)/items/report/[id].tsx (2depth 화면)
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ReportDetail } from '@/components/report/ReportDetail';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView className="flex-1 px-4">
      <ReportDetail reportId={id!} />
    </ScrollView>
  );
}
```

## 동적 레이아웃 요소 제어

### 문제: 각 화면마다 다른 FloatingActionBar가 필요한 경우

**해결책 1: 라우트 기반 조건부 렌더링**

```typescript
// app/(tabs)/_layout.tsx
import { usePathname } from 'expo-router';

export default function TabsLayout() {
  const pathname = usePathname();

  const getFloatingActions = () => {
    if (pathname === '/') {
      return [{ icon: 'add', onPress: handleAddItem, variant: 'primary' }];
    }
    if (pathname === '/items') {
      return [{ icon: 'add', onPress: handleAddItem, variant: 'primary' }];
    }
    return undefined;
  };

  return (
    <>
      <Tabs>...</Tabs>
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </>
  );
}
```

**해결책 2: Context API**

```typescript
// contexts/LayoutContext.tsx
import { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  floatingActions?: FloatingAction[];
  setFloatingActions: (actions?: FloatingAction[]) => void;
}

const LayoutContext = createContext<LayoutContextType>({} as LayoutContextType);

export function LayoutProvider({ children }) {
  const [floatingActions, setFloatingActions] = useState<FloatingAction[]>();

  return (
    <LayoutContext.Provider value={{ floatingActions, setFloatingActions }}>
      {children}
    </LayoutContext.Provider>
  );
}

export const useLayout = () => useContext(LayoutContext);

// app/(tabs)/_layout.tsx
export default function TabsLayout() {
  return (
    <LayoutProvider>
      <Tabs>...</Tabs>
      <LayoutConsumer />
    </LayoutProvider>
  );
}

function LayoutConsumer() {
  const { floatingActions } = useLayout();

  return floatingActions ? <FloatingActionBar actions={floatingActions} /> : null;
}

// app/(tabs)/index.tsx
export default function HomeScreen() {
  const { setFloatingActions } = useLayout();

  useEffect(() => {
    setFloatingActions([
      { icon: 'add', onPress: handleAddItem, variant: 'primary' }
    ]);

    return () => setFloatingActions(undefined);
  }, []);

  return <ScrollView>...</ScrollView>;
}
```

**권장: 해결책 1 (단순하고 명확함)**

## 헤더 제어

### 문제: 각 화면마다 다른 헤더 타이틀이 필요한 경우

Expo Router는 Screen options로 헤더를 제어하는 것을 권장:

```typescript
// app/(tabs)/_layout.tsx
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '대시보드',  // 탭바 타이틀
          headerTitle: '대시보드',  // 헤더 타이틀 (headerShown: true일 때)
        }}
      />
    </Tabs>
  );
}
```

우리가 커스텀 Header 컴포넌트를 사용하는 경우:

```typescript
// app/(tabs)/_layout.tsx
import { usePathname } from 'expo-router';

export default function TabsLayout() {
  const pathname = usePathname();

  const getHeaderTitle = () => {
    switch (pathname) {
      case '/': return '대시보드';
      case '/items': return '증빙';
      case '/reports': return '리포트';
      default: return '';
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Header title={getHeaderTitle()} showBack={false} />
      <Tabs screenOptions={{ headerShown: false }}>
        ...
      </Tabs>
    </SafeAreaView>
  );
}
```

## 마이그레이션 체크리스트

기존 코드를 Slot 패턴으로 마이그레이션할 때:

1. **레이아웃 파일 생성**
   - [ ] 각 디렉토리에 `_layout.tsx` 생성
   - [ ] 공통 UI 요소 (Header, SafeAreaView, FloatingActionBar) 추가
   - [ ] Stack/Tabs 네비게이터 설정

2. **화면 파일 수정**
   - [ ] 레이아웃 컴포넌트 제거 (TabScreenLayout, ScreenLayout 등)
   - [ ] 콘텐츠만 반환하도록 수정
   - [ ] SafeAreaView 제거 (레이아웃에서 처리)

3. **동적 요소 처리**
   - [ ] FloatingActionBar: 라우트 기반 조건부 렌더링
   - [ ] Header: usePathname()으로 타이틀 결정
   - [ ] 필요 시 Context API 사용

4. **검증**
   - [ ] TypeScript 컴파일 확인
   - [ ] 모든 화면 네비게이션 테스트
   - [ ] FloatingActionBar 위치 일관성 확인
   - [ ] 다크모드 동작 확인

## 베스트 프랙티스

### DO ✅

1. **레이아웃은 _layout.tsx에서만 정의**
   - Header, SafeAreaView, FloatingActionBar 등은 레이아웃 파일에서만

2. **화면 파일은 콘텐츠만 반환**
   - ScrollView, View, Text 등 페이지 고유 콘텐츠만

3. **공식 패턴 우선**
   - Stack/Tabs/Slot은 Expo Router 공식 컴포넌트 사용
   - 커스텀 네비게이터는 최후의 수단

4. **중복 네비게이터 피하기**
   - 이미 Stack이 있는데 하위에 또 Stack을 만들지 말 것

### DON'T ❌

1. **화면 파일에서 레이아웃 렌더링 금지**
   ```typescript
   // ❌ 잘못된 예
   export default function Screen() {
     return (
       <ScreenLayout>
         <Content />
       </ScreenLayout>
     );
   }
   ```

2. **공통 UI를 각 화면에 복사 금지**
   ```typescript
   // ❌ 잘못된 예: 각 화면에 FloatingActionBar 개별 구현
   export default function Screen1() {
     return (
       <>
         <Content />
         <FloatingActionBar actions={...} />  {/* 위치 불일치 가능 */}
       </>
     );
   }
   ```

3. **레이아웃 컴포넌트 직접 사용 금지**
   - `TabScreenLayout`, `ScreenLayout` 같은 래퍼 컴포넌트 대신
   - Expo Router의 Stack/Tabs/Slot을 직접 사용

## 참고 자료

- [Expo Router - Navigation layouts](https://docs.expo.dev/router/basics/layout/)
- [Expo Router - Common navigation patterns](https://docs.expo.dev/router/basics/common-navigation-patterns/)
- [Expo Router - Stack](https://docs.expo.dev/router/advanced/stack/)
- [Expo Router - Custom tab layouts](https://docs.expo.dev/router/advanced/custom-tabs/)

## 마무리

이 가이드는 Expo Router 공식 문서를 기반으로 작성되었습니다. 모든 레이아웃 결정은 공식 패턴을 따라야 하며, 불확실한 경우 항상 공식 문서를 먼저 확인하세요.

**핵심 요약:**
- **_layout.tsx**: 레이아웃 + 공통 UI 정의
- **화면 파일**: 콘텐츠만 반환
- **Slot**: 네비게이터 없는 레이아웃
- **Stack/Tabs**: Expo Router 공식 네비게이터 사용
