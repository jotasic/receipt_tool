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

### 현재 잘못된 구조

```
app/
├── (tabs)/
│   ├── _layout.tsx          (Tabs 네비게이터만 정의)
│   ├── index.tsx            (❌ TabScreenLayout 렌더링)
│   ├── items.tsx            (❌ TabScreenLayout 렌더링)
│   └── reports.tsx          (❌ TabScreenLayout 렌더링)
├── item/
│   ├── [id].tsx             (❌ ScreenLayout 렌더링)
│   └── add.tsx              (❌ ScreenLayout 렌더링)
```

**문제점:**
- 각 화면 파일이 독립적으로 레이아웃 컴포넌트를 렌더링
- FloatingActionBar가 각 화면에 개별 구현되어 위치 불일치
- 공통 UI 요소를 prop으로 제어할 수 없음
- Expo Router의 공식 패턴을 따르지 않음

### 올바른 구조

```
app/
├── _layout.tsx              (루트: 프로바이더 + Slot)
├── (tabs)/
│   ├── _layout.tsx          (Tabs + 공통 Header + FloatingActionBar)
│   ├── index.tsx            (대시보드 콘텐츠만)
│   ├── items.tsx            (증빙 목록 콘텐츠만)
│   └── reports.tsx          (리포트 목록 콘텐츠만)
├── item/
│   ├── _layout.tsx          (Stack + 공통 Header + FloatingActionBar)
│   ├── [id].tsx             (상세 화면 콘텐츠만)
│   └── add.tsx              (추가 폼 콘텐츠만)
├── report/
│   ├── _layout.tsx          (Stack + 공통 Header)
│   ├── [id].tsx             (리포트 상세 콘텐츠만)
│   └── monthly/
│       ├── _layout.tsx      (Stack + 공통 Header)
│       └── [year]/[month].tsx  (월별 리포트 콘텐츠만)
```

**장점:**
- 공식 Expo Router 패턴 준수
- 레이아웃 일관성 보장 (FloatingActionBar 위치 통일)
- 레이아웃 요소를 prop으로 제어 가능
- 코드 중복 제거

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

탭 네비게이터 + 공통 UI:

```typescript
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';
import { FloatingActionBar } from '@/components/common';
import { useState } from 'react';

export default function TabsLayout() {
  const [currentRoute, setCurrentRoute] = useState('index');

  // 라우트별 FloatingActionBar 설정
  const getFloatingActions = () => {
    switch (currentRoute) {
      case 'index':
        return [{ icon: 'add', onPress: () => {}, variant: 'primary' }];
      case 'items':
        return [{ icon: 'add', onPress: () => {}, variant: 'primary' }];
      default:
        return undefined;
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,  // 우리가 직접 Header 컴포넌트 사용
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '대시보드',
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

      {/* 공통 FloatingActionBar */}
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
```

### 3. Stack 레이아웃 (app/item/_layout.tsx)

Stack 네비게이터 + 공통 헤더:

```typescript
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ItemLayout() {
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,  // 우리가 직접 제어
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="[id]" />
        <Stack.Screen name="add" />
      </Stack>
    </SafeAreaView>
  );
}
```

### 4. 화면 파일 (콘텐츠만)

화면 파일은 레이아웃 요소 없이 콘텐츠만 반환:

```typescript
// app/(tabs)/index.tsx
import { ScrollView, View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <Text className="text-xl font-bold">대시보드</Text>
        {/* 콘텐츠 */}
      </View>
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
