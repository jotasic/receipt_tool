# 라우팅 구조

Receipt Tool의 Expo Router 기반 라우팅 구조입니다.

## 개요

```
app/
├── _layout.tsx                 (루트 레이아웃: 프로바이더 + Slot)
└── (tabs)/
    ├── _layout.tsx             (상단 Tabs 정의)
    ├── index/                  (홈 탭)
    │   ├── _layout.tsx         (홈 탭의 Stack + Header)
    │   ├── index.tsx           (대시보드)
    │   └── item/               (항목 2depth)
    │       ├── _layout.tsx     (항목 Stack)
    │       └── [id].tsx        (항목 상세)
    ├── items/                  (증빙 탭)
    │   ├── _layout.tsx         (증빙 탭의 Stack + Header + FloatingActionBar)
    │   ├── index.tsx           (증빙 목록)
    │   └── report/             (리포트 2depth)
    │       ├── _layout.tsx     (리포트 Stack)
    │       └── [id].tsx        (리포트 상세)
    ├── calendar/               (달력 탭)
    │   ├── _layout.tsx         (달력 탭의 Stack + Header)
    │   └── index.tsx           (달력 뷰)
    ├── reports/                (리포트 탭)
    │   ├── _layout.tsx         (리포트 탭의 Stack + Header + FloatingActionBar)
    │   └── index.tsx           (리포트 목록)
    └── settings/               (설정 탭)
        ├── _layout.tsx         (설정 탭의 Stack + Header)
        └── index.tsx           (설정 화면)
```

## 라우팅 경로

### 1depth 화면 (탭 기본 화면)

| 탭 | 경로 | 파일 |
|----|------|------|
| 홈 | `/` | `app/(tabs)/index/index.tsx` |
| 증빙 | `/items` | `app/(tabs)/items/index.tsx` |
| 달력 | `/calendar` | `app/(tabs)/calendar/index.tsx` |
| 리포트 | `/reports` | `app/(tabs)/reports/index.tsx` |
| 설정 | `/settings` | `app/(tabs)/settings/index.tsx` |

### 2depth 화면 (탭 내부 Stack)

| 화면 | 경로 | 파일 |
|------|------|------|
| 항목 상세 | `/item/[id]` | `app/(tabs)/index/item/[id].tsx` |
| 리포트 상세 | `/items/report/[id]` | `app/(tabs)/items/report/[id].tsx` |

### 절대 경로 vs 상대 경로

**절대 경로 (권장하지 않음):**
```typescript
router.push('/(tabs)/items/report/123');  // 다른 탭으로 이동 가능
```

**상대 경로 (권장):**
```typescript
// 홈 탭에서
router.push('item/123');  // /(tabs)/index/item/123으로 이동

// 증빙 탭에서
router.push('report/123');  // /(tabs)/items/report/123으로 이동
```

## 구조 설계 원칙

### 1. 각 탭이 자신의 2depth 화면 관리

**목표:** 헤더 깜빡임 제거 및 탭별 히스토리 독립성

```
이전 구조:
app/(tabs)/
└── index.tsx
app/item/
└── [id].tsx
→ Root Stack 필요 → 헤더 깜빡임

현재 구조:
app/(tabs)/index/
├── index.tsx
└── item/[id].tsx
→ 탭 내부 Stack → 헤더 일관성
```

### 2. Tabs의 역할

**app/(tabs)/_layout.tsx:**
- Tabs 네비게이터만 정의
- 각 탭의 내부 구조는 관리하지 않음
- SafeAreaView, Header, FloatingActionBar는 포함하지 않음

### 3. 각 탭 레이아웃의 역할

**app/(tabs)/{tabName}/_layout.tsx:**
- SafeAreaView로 전체 감싸기
- Header 컴포넌트 (타이틀, 뒤로가기 등)
- Stack 네비게이터 (1depth + 2depth 화면)
- FloatingActionBar (조건부)

### 4. 2depth Stack의 역할

**app/(tabs)/{tabName}/{screenName}/_layout.tsx:**
- Stack만 정의 (headerShown: false)
- SafeAreaView, Header 불필요 (부모에서 관리)
- FloatingActionBar 불필요 (부모에서 관리)

## 네비게이션 예시

### 홈 탭에서 항목 상세로 이동

```typescript
// app/(tabs)/index/index.tsx (대시보드)
import { useRouter } from 'expo-router';

export default function HomeTab() {
  const router = useRouter();

  const handleSelectItem = (itemId: string) => {
    // 상대 경로 사용
    router.push(`item/${itemId}`);
    // → /(tabs)/index/item/{itemId}로 이동
  };

  return (
    // ...
  );
}
```

### 증빙 탭에서 리포트 상세로 이동

```typescript
// app/(tabs)/items/index.tsx (증빙 목록)
import { useRouter } from 'expo-router';

export default function ItemsTab() {
  const router = useRouter();

  const handleSelectReport = (reportId: string) => {
    // 상대 경로 사용
    router.push(`report/${reportId}`);
    // → /(tabs)/items/report/{reportId}로 이동
  };

  return (
    // ...
  );
}
```

### 뒤로가기

```typescript
import { useRouter } from 'expo-router';

export default function ItemDetailScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();  // 같은 탭 내에서 이전 화면으로 이동
  };

  return (
    // ...
  );
}
```

## 탭 전환과 히스토리

### 탭별 독립적 히스토리

```
홈 탭:     대시보드 → 항목 상세
증빙 탭:   증빙 목록 → 리포트 상세

탭 전환 시:
- 홈 탭 → 증빙 탭: 증빙 목록이 표시 (최후 위치 유지)
- 증빙 탭 → 홈 탭: 항목 상세가 표시 (최후 위치 유지)
```

### 이점

1. **컨텍스트 유지:** 탭 전환 후 돌아오면 이전 상태 유지
2. **예측 가능:** 뒤로가기가 같은 탭 내에서만 작동
3. **분리:** 다른 탭의 히스토리가 현재 탭에 영향 없음

## 라우팅 베스트 프랙티스

### DO ✅

1. **탭 내에서 상대 경로 사용**
   ```typescript
   router.push(`item/${id}`);  // 상대 경로
   ```

2. **useLocalSearchParams 사용**
   ```typescript
   const { id } = useLocalSearchParams<{ id: string }>();
   ```

3. **각 탭이 자신의 히스토리 관리**
   ```typescript
   // 각 탭의 _layout.tsx에서 Stack으로 관리
   <Stack>
     <Stack.Screen name="index" />
     <Stack.Screen name="detail/[id]" />
   </Stack>
   ```

### DON'T ❌

1. **절대 경로로 다른 탭 접근**
   ```typescript
   // ❌ 피해야 할 패턴
   router.push('/(tabs)/items/report/123');
   ```

2. **useRoute 사용 (React Navigation 패턴)**
   ```typescript
   // ❌ 피해야 할 패턴
   const route = useRoute();
   const { id } = route.params;

   // ✅ 올바른 패턴
   const { id } = useLocalSearchParams();
   ```

3. **Root 레벨에 2depth 화면 추가**
   ```typescript
   // ❌ 피해야 할 패턴
   // app/item/[id].tsx - Root에 위치

   // ✅ 올바른 패턴
   // app/(tabs)/index/item/[id].tsx - 탭 내부에 위치
   ```

## 마이그레이션 체크리스트

### 라우팅 구조 전환

- [ ] Root의 `app/item/`, `app/report/` 폴더 제거
- [ ] 각 탭 디렉토리에 `_layout.tsx` 생성
- [ ] 2depth 화면을 각 탭 내부로 이동
- [ ] `router.push` 경로 업데이트 (상대 경로로 변경)
- [ ] `useRoute` → `useLocalSearchParams` 변경
- [ ] 각 탭의 Stack 정의 확인

### 검증

- [ ] TypeScript 컴파일 확인
- [ ] 모든 탭 간 전환 테스트
- [ ] 뒤로가기 제스처 정상 동작 확인
- [ ] 탭별 히스토리 독립성 확인
- [ ] 다크모드 동작 확인

## 참고

- [Layout Policy](/docs/guides/layout-policy.md) - 레이아웃 정책
- [Expo Router 레이아웃 가이드](/docs/guides/expo-router-layout.md) - 공식 패턴
- [Expo Router 공식 문서](https://docs.expo.dev/router/introduction/) - 공식 문서
