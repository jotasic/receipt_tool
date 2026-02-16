# CLAUDE.md Template: React Native + NativeWind Design System

이 템플릿은 React Native + NativeWind를 사용하는 프로젝트를 위한 범용 CLAUDE.md 파일입니다.

프로젝트에 맞게 플레이스홀더를 수정하여 사용하세요.

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

{{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 문서 참조

상세 정보는 아래 문서 참조:

| 문서 | 내용 |
|-----|-----|
| [/docs/architecture.md](/docs/architecture.md) | 아키텍처, 기술 스택, 데이터 모델 |
| [/docs/services.md](/docs/services.md) | 서비스 함수 레퍼런스 |
| [/docs/guides/design-system-setup.md](/docs/guides/design-system-setup.md) | 디자인 시스템 가이드 |

{{ADDITIONAL_DOCS}}

## 개발 환경

```bash
# 타겟: {{PRIMARY_PLATFORM}} ({{SECONDARY_PLATFORM}} 호환성 고려)
npx expo start --{{PRIMARY_PLATFORM_OPTION}}

# 테스트
npm test

# 타입 체크
npx tsc --noEmit

# 스타일 검증
npm run lint
```

### 플랫폼 규칙

- **{{PRIMARY_PLATFORM}} 우선 개발**
- 필요 시 {{PRIMARY_PLATFORM}} 전용 네이티브 기능 적극 활용
- {{SECONDARY_PLATFORM}} 호환성 위해 플랫폼 분기 처리 (`Platform.OS`)

---

## 개발 워크플로우

### 기능 추가 요청 시 사이클

```
요청 → 계획 수립 → 사용자 확인 → 순차 실행 → 완료 보고
```

#### 1. 계획 단계

- /docs/architecture.md 참조하여 현재 구조 파악
- 기능 분석 및 우선순위 분류 (P0/P1/P2)
- 적절한 에이전트 선정
- **사용자에게 계획 제시 후 승인 받기**

#### 2. 실행 단계

각 작업마다:
```
에이전트 실행 → 구현 → 문서 업데이트 → 검증 → 커밋
```

- TodoWrite로 진행 상황 추적
- TypeScript 검증: `npx tsc --noEmit`
- 다크모드 검증: 스타일에 `dark:` 클래스 포함

#### 3. 완료 단계

- 완료 보고 (커밋 수, 변경 파일, 테스트 방법)

---

## 에이전트 선택 기준

| 작업 유형 | 에이전트 | 예시 |
|----------|---------|------|
| UI/화면/서비스 | `react-native-expo-developer` | 화면, 컴포넌트, 서비스 로직 |
| DB 스키마/쿼리 | `database-specialist` | 스키마, 마이그레이션 |
| 문서 작업 | `doc-writer` | 가이드, README |
| 코드 리뷰 | `code-reviewer` | PR 리뷰 |
| 구조 설계 | `architect` | 시스템 설계 |
| 디자인 시스템 | `react-native-expo-developer` | 토큰, 컴포넌트, 테마 |

---

## 품질 기준

- [ ] TypeScript 에러 0
- [ ] 다크모드 지원 (`dark:` 클래스)
- [ ] 한국어 UI 메시지
- [ ] 에러 핸들링 (try-catch, Alert)
- [ ] 로딩 상태 표시
- [ ] {{PRIMARY_PLATFORM}}에서 정상 동작

---

## 디자인 시스템

### 아키텍처

프로젝트는 다음과 같은 디자인 시스템을 사용합니다:

```
design-system/
├── tokens/              ← 디자인 토큰 (색상, 간격, 타이포그래피)
├── hooks/               ← 커스텀 React 훅 (테마, 스타일)
├── layouts/             ← 레이아웃 컴포넌트
└── README.md
```

### 디자인 토큰

**색상** (`design-system/tokens/colors.ts`)
- 기본 색상: primary, secondary
- 의미 색상: success, warning, error
- 분류별 색상: classification, usagePurpose
- 라이트/다크 모드: light.*, dark.*

**간격** (`design-system/tokens/spacing.ts`)
- 스케일: xs(4px), sm(8px), md(16px), lg(24px), xl(32px), 2xl(40px), 3xl(48px)
- 보더 반지름: sm, md, lg, xl, full

**타이포그래피** (`design-system/tokens/typography.ts`)
- 폰트 사이즈: xs(12px) ~ 3xl(40px)
- 폰트 가중치: regular, medium, semibold, bold
- 라인 높이: tight(1.2), normal(1.5), relaxed(1.75)

### NativeWind 스타일링 패턴

**기본 스타일: NativeWind (Tailwind CSS)**

```tsx
// 선호: NativeWind 클래스 사용
<View className="bg-white dark:bg-gray-900 p-4 rounded-lg">
  <Text className="text-gray-900 dark:text-gray-50 font-semibold">Title</Text>
</View>
```

**동적 색상: useThemeColor 훅**

```tsx
import { useThemeColor } from '@/design-system/hooks';

function MyComponent() {
  const iconColor = useThemeColor('#374151', '#D1D5DB');

  return (
    <View className="p-4">
      <Ionicons name="heart" size={24} color={iconColor} />
    </View>
  );
}
```

**복잡한 스타일: useThemedStyles 훅**

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

### 레이아웃 컴포넌트

**ScreenLayout**: 기본 화면 레이아웃

```tsx
<ScreenLayout
  title="화면 제목"
  showHeader
  showBack
  rightElement={<CustomButton />}
  scrollable
>
  <View>{/* 컨텐츠 */}</View>
</ScreenLayout>
```

**속성:**
- `title`: 헤더 타이틀
- `showHeader`: 헤더 표시 여부 (기본값: false)
- `showBack`: 뒤로가기 버튼 표시 여부 (기본값: false)
- `rightElement`: 헤더 오른쪽 요소
- `scrollable`: 스크롤 가능 여부 (기본값: true)
- `edges`: SafeAreaView edges 설정

### 커스터마이징

**새 색상 추가:**
1. `design-system/tokens/colors.ts`에 색상 추가
2. `tailwind.config.js`의 `colors` 확장에 추가
3. NativeWind 클래스로 사용: `className="text-custom-color"`

**새 타이포그래피 토큰 추가:**
1. `design-system/tokens/typography.ts`에 추가
2. `tailwind.config.js`의 `fontSize`, `fontWeight` 확장에 추가

---

## 문서화 규칙

### 원칙: 문서 = 실제 코드 상태

```
기능 추가 → 문서에 추가
기능 삭제 → 문서에서 삭제
기능 수정 → 문서도 수정
```

**미구현/계획 내용은 문서에 포함하지 않음**

### 업데이트 대상

| 변경 유형 | 업데이트 문서 |
|----------|-------------|
| 새 서비스/컴포넌트 | /docs/architecture.md |
| 새 DB 함수 | /docs/services.md |
| 복잡한 기능 | /docs/guides/{기능}.md |
| 디자인 토큰 변경 | /docs/guides/design-system-setup.md |

### 방식

- 해당 기능 커밋에 문서 변경 포함 (별도 커밋 X)
- 예: `feat: 새 버튼 컴포넌트 추가` 커밋에 architecture.md 업데이트 포함

### 문서 파일명 스타일

**kebab-case 통일** (README.md 제외)

```
✅ architecture.md, services.md, design-system-setup.md
✅ getting-started.md, item-service.md
❌ ARCHITECTURE.md, API.md, DESIGN_SYSTEM.md
```

### 문서 크기 관리

**원칙: 나중에 분리하지 말고 처음부터 모듈화**

- 메인 문서: Quick Reference + 링크 인덱스
- 상세 내용: 하위 폴더에 논리적 단위로 분리

---

## 코드 컨벤션

- Expo Router (파일 기반 라우팅)
- TypeScript 필수
- 함수형 컴포넌트 + React Hooks
- 컴포넌트명: PascalCase
- 파일명: kebab-case 또는 camelCase
- 스타일: NativeWind (Tailwind CSS) + 디자인 토큰

---

## 언어 규칙

| 대상 | 언어 | 비고 |
|-----|-----|------|
| 커밋 메시지 | 한글 | 타입은 영어 (feat, fix 등) |
| 문서 (docs/) | 한글 | 코드 예시는 영어 |
| UI 메시지 | 한글 | 에러, 알림, 레이블 등 |
| 코드 주석 | 영어/한글 | 자유 |
| 변수/함수명 | 영어 | camelCase |

---

## 커밋 규칙

### 형식

```
{타입}({범위}): {설명}

{본문 (선택)}

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 타입

| 타입 | 용도 |
|-----|-----|
| feat | 새 기능 |
| fix | 버그 수정 |
| docs | 문서 변경 |
| refactor | 리팩토링 |
| chore | 기타 |

### 규칙

- **한글로 작성**
- 원자적 커밋 (1 기능 = 1 커밋)
- 문서 변경은 관련 기능 커밋에 포함

### 예시

```
feat(디자인): 새 버튼 컴포넌트 추가

- PrimaryButton, SecondaryButton 컴포넌트 생성
- 디자인 토큰 기반 스타일링
- 다크모드 지원
- 로딩 상태 지원

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 플레이스홀더 가이드

| 플레이스홀더 | 예시 |
|-------------|-----|
| {{PROJECT_NAME}} | "회사 경비 청구를 위한 증빙 관리 앱" |
| {{PROJECT_DESCRIPTION}} | "OCR 스캔, 2D 분류, 리포트 생성" |
| {{PRIMARY_PLATFORM}} | "Android" |
| {{SECONDARY_PLATFORM}} | "iOS" |
| {{PRIMARY_PLATFORM_OPTION}} | "android" |
| {{ADDITIONAL_DOCS}} | 추가 문서 링크 (필요시) |

---

## 참고

이 템플릿은 다음을 기반으로 작성되었습니다:
- NativeWind 기반 스타일 시스템
- React Native + Expo 구조
- 디자인 토큰 패턴
- 다크모드 지원 아키텍처
