# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

회사 경비 청구를 위한 증빙서류 관리 앱 (OCR 스캔, 2D 분류, 리포트 생성)

## 문서 참조

상세 정보는 아래 문서 참조:

| 문서 | 내용 |
|-----|-----|
| [/docs/ARCHITECTURE.md](/docs/ARCHITECTURE.md) | 아키텍처, 기술 스택, 데이터 모델 (SSOT) |
| [/docs/API.md](/docs/API.md) | API/함수 레퍼런스 |
| [/docs/guides/database.md](/docs/guides/database.md) | 데이터베이스 가이드 |
| [/docs/guides/ocr.md](/docs/guides/ocr.md) | OCR 시스템 가이드 |
| [/docs/MIGRATION_GUIDE.md](/docs/MIGRATION_GUIDE.md) | 모델 진화 히스토리 |

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

## 개발 워크플로우

### 기능 추가 요청 시 사이클

```
요청 → 계획 수립 → 사용자 확인 → 순차 실행 → 완료 보고
```

#### 1. 계획 단계

- /docs/ARCHITECTURE.md 참조하여 현재 구조 파악
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

#### 3. 완료 단계

- 완료 보고 (커밋 수, 변경 파일, 테스트 방법)

---

## 에이전트 선택 기준

| 작업 유형 | 에이전트 | 예시 |
|----------|---------|------|
| UI/화면/컴포넌트 | `react-native-expo-developer` | 화면, 폼, 스타일 |
| 비즈니스 로직 | `backend-developer` | 서비스, 마이그레이션 |
| 데이터베이스 | `database-specialist` | 스키마, CRUD |
| 문서 작업 | `doc-writer` | 가이드, README |
| 코드 리뷰 | `code-reviewer` | PR 리뷰 |

---

## 품질 기준

- [ ] TypeScript 에러 0
- [ ] 다크 모드 지원 (`dark:` 클래스)
- [ ] 한국어 UI 메시지
- [ ] 에러 핸들링 (try-catch, Alert)
- [ ] 로딩 상태 표시
- [ ] Android에서 정상 동작

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
| 새 서비스/컴포넌트 | /docs/ARCHITECTURE.md |
| 새 DB 함수 | /docs/API.md |
| 복잡한 기능 | /docs/guides/{기능}.md |

### 방식

- 해당 기능 커밋에 문서 변경 포함 (별도 커밋 X)
- 예: `feat: 푸시 알림 추가` 커밋에 ARCHITECTURE.md 업데이트 포함

### 문서 크기 관리 (모듈화)

문서가 커지면 논리적 단위로 모듈화:

```
/docs/
├── ARCHITECTURE.md          ← 요약 + 인덱스 (링크)
├── API.md                   ← 요약 + 인덱스 (링크)
│
├── architecture/            ← 상세 내용 분리
│   ├── services.md
│   ├── components.md
│   └── database.md
│
└── api/                     ← 상세 내용 분리
    ├── item-service.md
    └── tag-service.md
```

**규칙:**
- 메인 문서(ARCHITECTURE.md, API.md)는 요약 + 링크만 유지
- 상세 내용은 하위 폴더에 논리적 단위로 분리
- 글자수 제한 없음 (논리적 단위 기준)

---

## 코드 컨벤션

- Expo Router (파일 기반 라우팅)
- TypeScript 필수
- 함수형 컴포넌트 + React Hooks
- 컴포넌트명: PascalCase
- 파일명: kebab-case 또는 camelCase
- 스타일: NativeWind (Tailwind CSS)

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
