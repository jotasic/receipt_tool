# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

회사 경비 청구를 위한 증빙서류 관리 앱 (OCR 스캔, 2D 분류, 리포트 생성)

## 문서 참조

상세 정보는 아래 문서 참조:

| 문서 | 내용 |
|-----|-----|
| [/docs/architecture.md](/docs/architecture.md) | 아키텍처, 기술 스택, 데이터 모델 (SSOT) |
| [/docs/services.md](/docs/services.md) | 서비스 함수 레퍼런스 |
| [/docs/guides/development-workflow.md](/docs/guides/development-workflow.md) | 개발 워크플로우 상세 가이드 (필독) |
| [/docs/guides/getting-started.md](/docs/guides/getting-started.md) | 개발 환경 설정 및 시작 가이드 |
| [/docs/guides/database.md](/docs/guides/database.md) | 데이터베이스 가이드 |
| [/docs/guides/ocr.md](/docs/guides/ocr.md) | OCR 시스템 가이드 |
| [/docs/guides/design-system.md](/docs/guides/design-system.md) | 디자인 시스템 사용 가이드 |
| [/docs/guides/layout-policy.md](/docs/guides/layout-policy.md) | 레이아웃 및 모달 정책 |
| [/docs/migration-guide.md](/docs/migration-guide.md) | 모델 진화 히스토리 |

## 개발 환경

```bash
# 타겟: Android (iOS 호환성 고려)
npx expo start --android

# 테스트
npm test

# 타입 체크
npx tsc --noEmit
```

### 플랫폼 규칙

- **Android 우선 개발**
- 필요 시 Android 전용 네이티브 기능 적극 활용
- iOS 호환성 위해 플랫폼 분기 처리 (`Platform.OS`)

---

## CRITICAL: 공식 문서 우선 원칙

**모든 개발 결정은 공식 문서를 기반으로 합니다.**

### 강제 규칙

```
의사결정 시: 공식 문서 확인 → 패턴 적용 → 구현
불확실할 때: 추측 금지 → 공식 문서 검색 → 확인 후 진행
```

### 적용 범위

이 원칙은 **모든 기술 스택과 모든 에이전트**에 적용됩니다:

| 기술 스택 | 공식 문서 |
|----------|----------|
| Expo | https://docs.expo.dev/ |
| Expo Router | https://docs.expo.dev/router/introduction/ |
| React Native | https://reactnative.dev/docs/getting-started |
| React Navigation | https://reactnavigation.org/docs/getting-started |
| NativeWind | https://www.nativewind.dev/ |
| TypeScript | https://www.typescriptlang.org/docs/ |
| SQLite | https://github.com/expo/expo/tree/main/packages/expo-sqlite |

### 의무 사항

1. **패턴 결정 전**: 반드시 공식 문서에서 권장 패턴 확인
2. **불확실할 때**: 추측하지 말고 공식 문서 검색
3. **구현 후**: 공식 패턴과 일치하는지 검증
4. **문제 발견 시**: 공식 패턴으로 즉시 수정

### 예시

#### ✅ 올바른 접근

```
사용자: "Expo Router에서 레이아웃을 어떻게 구성해야 하나요?"
Claude:
1. Expo Router 공식 문서 검색 (WebSearch)
2. Layouts 가이드 확인
3. Slot pattern이 공식 권장 패턴임을 확인
4. 해당 패턴으로 구현 제안
```

#### ❌ 잘못된 접근

```
사용자: "Expo Router에서 레이아웃을 어떻게 구성해야 하나요?"
Claude: "제 경험상 이렇게 하면 될 것 같습니다..."
→ 공식 문서 확인 없이 추측하여 잘못된 패턴 사용
```

### 검증 체크리스트

새로운 패턴/구조 도입 시:
- [ ] 공식 문서에서 해당 기능 검색 완료
- [ ] 권장 패턴 확인 완료
- [ ] 예제 코드 참고 완료
- [ ] 우리 코드가 공식 패턴과 일치함

### 중요 사항

- **이 원칙은 모든 에이전트에 적용됩니다** (react-native-expo-developer, database-specialist, doc-writer, architect 등)
- **디자인 시스템뿐만 아니라 모든 코드**에 적용됩니다
- **기존 코드도 공식 패턴과 불일치하면 수정**해야 합니다

---

## 개발 워크플로우

### CRITICAL: 워크플로우 강제 규칙

**코드 변경을 수반하는 모든 요청은 다음 규칙을 반드시 따릅니다:**

```
계획 수립 → 사용자 승인 대기 → 승인 후 실행 → 완료 보고
```

**이 워크플로우는 필수이며 건너뛸 수 없습니다.**
- "진행", "해줘", "시작" 같은 명령도 예외 없음
- 계획이 없으면 먼저 계획 수립 후 사용자 승인 대기
- 승인 전 실행 단계 진행 금지

#### 예시

**❌ 나쁜 예: 워크플로우 건너뛰기**
```
사용자: "로그인 기능 추가해줘"
Claude: [바로 에이전트 호출하여 구현 시작]
→ 위반! 계획 제시 필요
```

**✅ 좋은 예: 워크플로우 준수**
```
사용자: "로그인 기능 추가해줘"
Claude:
1. /docs/architecture.md 검토
2. 계획 수립 (TodoWrite 사용)
3. 계획 제시 및 승인 대기
사용자: "좋습니다, 진행하세요"
Claude: [에이전트 호출하여 구현 시작]
```

#### 예외 케이스 (워크플로우 불필요)

다음 요청은 계획 수립 없이 즉시 처리 가능:
- **정보 조회**: 파일 읽기, 검색, 상태 확인
- **문서 설명**: 기존 코드/기능 설명 요청
- **질문/상담**: 개발 관련 조언, 의견 요청

**구분 기준: 코드 변경이 필요하면 계획부터, 필요 없으면 즉시 답변**

### 기능 추가 요청 시 사이클

```
요청 → 계획 수립 → 사용자 확인 → 순차 실행 → 완료 보고
```

#### 1. 계획 단계 (필수)

- /docs/architecture.md 참조하여 현재 구조 파악
- 기능 분석 및 우선순위 분류 (P0/P1/P2)
- 적절한 에이전트 선정
- **TodoWrite로 계획 작성**
- **사용자에게 계획 제시 후 승인 대기** (승인 없이 진행 금지)

#### 2. 실행 단계

각 작업마다:
```
에이전트 실행 → 구현 → 문서 업데이트 → 검증 → 커밋
```

- TodoWrite로 진행 상황 추적
- TypeScript 검증: `npx tsc --noEmit`

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

---

## 품질 기준

모든 코드는 다음 기준을 충족해야 합니다:

- [ ] TypeScript 에러 0
- [ ] **다크 모드 완벽 지원 (필수)**
- [ ] 한국어 UI 메시지
- [ ] 에러 핸들링 (try-catch, Alert)
- [ ] 로딩 상태 표시
- [ ] Android에서 정상 동작

### CRITICAL: 다크모드는 필수 요구사항

**모든 색상은 다크모드를 고려해야 합니다. 하드코딩 색상은 금지입니다.**

#### ✅ 올바른 방법

1. **NativeWind 클래스 (권장)**
   ```typescript
   <View className="bg-white dark:bg-gray-800">
     <Text className="text-gray-900 dark:text-gray-100">텍스트</Text>
   </View>
   ```

2. **useThemeColor 훅**
   ```typescript
   import { useThemeColor } from '@/design-system/hooks/useThemeColor';

   const iconColor = useThemeColor('#374151', '#D1D5DB');
   <Ionicons name="star" color={iconColor} />
   ```

3. **useThemedStyles 훅**
   ```typescript
   import { useThemedStyles } from '@/design-system/hooks/useThemedStyles';

   const styles = useThemedStyles((colors) => ({
     container: { backgroundColor: colors.background },
     text: { color: colors.text },
   }));
   ```

#### ❌ 절대 금지 (다크모드 대응 안됨)

```typescript
// ❌ 하드코딩 색상
<View style={{ backgroundColor: '#FFFFFF' }}>
  <Text style={{ color: '#000000' }}>텍스트</Text>
</View>

// ❌ Ionicons 고정 색상
<Ionicons name="star" color="#374151" />

// ❌ ActivityIndicator 고정 색상
<ActivityIndicator color="#3B82F6" />
```

#### 검증 체크리스트

새 코드 작성 시:
- [ ] 모든 색상이 `dark:` 클래스 또는 훅 사용
- [ ] 하드코딩 색상 없음 (`color="#"`, `backgroundColor: '#'`)
- [ ] 다크모드 실행 후 시각적 확인 완료

---

## 문서화 규칙

### 핵심 원칙

1. **문서 = 코드**: 실제 구현된 내용만 문서화 (미구현/계획 내용 제외)
2. **동시 업데이트**: 기능 커밋에 관련 문서 변경 포함 (별도 커밋 X)
3. **모듈화 우선**: 처음부터 구조화 (나중 분리는 링크 깨짐, 히스토리 손실)
4. **파일명 통일**: kebab-case 사용 (README.md 제외)

### 문서 구조

| 문서 | 역할 |
|-----|------|
| `/docs/architecture.md` | 아키텍처 개요 + 인덱스 |
| `/docs/services.md` | 서비스 함수 개요 + 인덱스 |
| `/docs/architecture/` | 상세 아키텍처 문서 |
| `/docs/services/` | 상세 서비스 문서 |
| `/docs/guides/` | 사용 가이드 |

**원칙: 메인 문서는 Quick Reference + 링크, 상세 내용은 하위 폴더**

---

## 코드 컨벤션

- Expo Router (파일 기반 라우팅)
- TypeScript 필수
- 함수형 컴포넌트 + React Hooks
- 컴포넌트명: PascalCase
- 파일명: kebab-case 또는 camelCase
- 스타일: NativeWind (Tailwind CSS)

### 컴포넌트 재사용 원칙 (필수)

**핵심 규칙: 동일한 화면/기능은 동일한 컴포넌트 사용**

#### 1. UI 컴포넌트 재사용
- ✅ **DO**: 2곳 이상 사용되는 UI는 즉시 공통 컴포넌트 추출
- ❌ **DON'T**: 복사-붙여넣기, "나중에 통일" 금지
- **위치**: `/components/common/` (범용), `/components/{domain}/` (도메인 전용)

#### 2. 기능 컴포넌트 통일 (신규)
- ✅ **DO**: 동일한 기능(추가/수정)은 항상 같은 컴포넌트로 구현
- ❌ **DON'T**: 화면마다 다른 방식으로 같은 기능 구현

**예시: 항목 추가/수정**
```typescript
// ✅ 좋은 예: ItemForm 모달을 모든 곳에서 사용
// 홈 탭
{showAddModal && <ItemForm onSubmit={handleCreate} onCancel={...} />}

// 증빙 탭
{showAddModal && <ItemForm onSubmit={handleCreate} onCancel={...} />}

// 항목 상세
{showEditModal && <ItemForm initialData={item} onSubmit={handleUpdate} onCancel={...} />}

// ❌ 나쁜 예: 화면마다 다른 방식
router.push('/item/add')  // 탭 A
{showModal && <ItemForm />}  // 탭 B
<ScreenLayout><ItemForm /></ScreenLayout>  // 화면 C
```

**체크리스트:**
- [ ] 동일한 기능을 하는 모든 화면에서 같은 컴포넌트 사용
- [ ] 라우팅 방식이 아닌 상태 기반 모달 방식 사용
- [ ] 중간 래퍼 화면 생성 금지 (컴포넌트 직접 사용)

상세 가이드는 [Design System Guide](/docs/guides/design-system.md) 참조

---

## 디자인 시스템

### 핵심 원칙

1. **레이아웃**: `_layout.tsx`에서만 정의 (Expo Router 공식 패턴)
   - 화면 파일은 콘텐츠만 반환
   - Header, SafeAreaView, FloatingActionBar, Stack/Tabs/Slot은 _layout.tsx에서만 사용
2. **추가/수정**: 무조건 `FullScreenModal` 사용 (하단 버튼 없음, 헤더 아이콘만)
3. **플로팅 버튼**: `FloatingActionBar` (원형 FAB 스타일, 아이콘만)
4. **다크모드**: 필수 지원 (`dark:` 클래스 또는 `useThemeColor` 훅)

### 관련 문서

상세한 사용법은 다음 문서를 참고하세요:

- [Expo Router 레이아웃 가이드](/docs/guides/expo-router-layout.md) - Expo Router 공식 패턴 (필독)
- [Layout Policy](/docs/guides/layout-policy.md) - 레이아웃 및 모달 정책
- [Design System Guide](/docs/guides/design-system.md) - 토큰, 훅, 컴포넌트 사용법
- [Design System Architecture](/docs/architecture/design-system.md) - 구조 및 확장 방법

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
feat(알림): 푸시 알림 기능 추가

- expo-notifications 설정
- 리포트 제출 시 알림 발송
- 알림 설정 화면 추가

Co-Authored-By: Claude <noreply@anthropic.com>
```
