# .claude 설정 가이드

새 프로젝트에서 `.claude/` 설정을 사용하기 위한 가이드입니다.

## 빠른 시작

```
1. .claude/ 폴더를 프로젝트 루트에 복사
2. 프로젝트 분석 (아래 체크리스트 참고)
3. 적절한 템플릿으로 CLAUDE.md 생성
4. /docs/ 구조 생성
5. 테스트: "이 프로젝트 구조 설명해줘"
```

---

## Step 1: 프로젝트 분석 체크리스트

CLAUDE.md 작성 전 프로젝트를 분석하세요:

### 기술 스택 감지

| 확인 항목 | 감지 방법 | 결과 |
|----------|----------|------|
| 프레임워크 | `package.json` 의존성 | React Native / Next.js / Express 등 |
| 언어 | 파일 확장자, tsconfig.json | TypeScript / JavaScript / Python |
| 데이터베이스 | 의존성, 설정 파일 | SQLite / PostgreSQL / MongoDB |
| 상태 관리 | 의존성 | Zustand / Redux / Context |
| 스타일링 | 의존성, 설정 | Tailwind / NativeWind / CSS Modules |

### 프로젝트 구조 확인

```bash
# 폴더 구조 확인
ls -la

# package.json 확인
cat package.json | head -50

# 기존 문서 확인
ls docs/ 2>/dev/null || echo "docs 폴더 없음"
```

### 핵심 질문

- [ ] 주요 플랫폼은? (모바일 / 웹 / 서버 / CLI)
- [ ] 커밋/문서 언어는? (한글 / 영어 / 혼합)
- [ ] 기존 문서 구조가 있는가?
- [ ] 주요 개발 명령어는?

---

## Step 2: 템플릿 선택

### 템플릿 A: React Native / Expo

```markdown
# CLAUDE.md

## 프로젝트

[앱 이름] - [간단한 설명]

## 문서 참조

| 문서 | 내용 |
|-----|------|
| [/docs/architecture.md](/docs/architecture.md) | 아키텍처, 기술 스택, 데이터 모델 |
| [/docs/services.md](/docs/services.md) | 서비스 함수 레퍼런스 |

## 개발 환경

\`\`\`bash
# 타겟: Android (iOS 호환)
npx expo start --android

# 테스트
npm test

# 타입 체크
npx tsc --noEmit
\`\`\`

### 플랫폼 규칙

- Android 우선 개발
- iOS 호환성은 `Platform.OS` 분기 처리

---

## 언어 규칙

| 대상 | 언어 | 비고 |
|-----|-----|------|
| 커밋 메시지 | 한글 | 타입은 영어 (feat, fix) |
| 문서 | 한글 | 코드 예시는 영어 |
| UI 메시지 | 한글 | 에러, 알림, 레이블 |
| 코드 주석 | 자유 | 영어/한글 |
| 변수/함수명 | 영어 | camelCase |

---

## 에이전트 선택

| 작업 유형 | 에이전트 |
|----------|---------|
| UI/화면/서비스 | \`react-native-expo-developer\` |
| DB 스키마/쿼리 | \`database-specialist\` |
| 문서 | \`doc-writer\` |
| 코드 리뷰 | \`code-reviewer\` |
| 아키텍처 | \`architect\` |

---

## 품질 기준

- [ ] TypeScript 에러 없음
- [ ] 다크 모드 지원 (\`dark:\` 클래스)
- [ ] 한국어 UI 메시지
- [ ] 에러 핸들링 (try-catch, Alert)
- [ ] 로딩 상태 표시
- [ ] Android에서 정상 동작

---

## 코드 컨벤션

- Expo Router (파일 기반 라우팅)
- TypeScript 필수
- 함수형 컴포넌트 + React Hooks
- 컴포넌트명: PascalCase
- 파일명: kebab-case 또는 camelCase
- 스타일: NativeWind (Tailwind CSS)
```

### 템플릿 B: Next.js / React 웹

```markdown
# CLAUDE.md

## 프로젝트

[프로젝트명] - [간단한 설명]

## 문서 참조

| 문서 | 내용 |
|-----|------|
| [/docs/architecture.md](/docs/architecture.md) | 아키텍처, 기술 스택 |
| [/docs/api.md](/docs/api.md) | API 레퍼런스 |

## 개발 환경

\`\`\`bash
npm run dev
npm run build
npm test
\`\`\`

---

## 언어 규칙

| 대상 | 언어 |
|-----|-----|
| 커밋 메시지 | 영어 |
| 문서 | 영어 |
| UI 메시지 | 영어 |
| 변수/함수명 | 영어 |

---

## 에이전트 선택

| 작업 유형 | 에이전트 |
|----------|---------|
| UI/컴포넌트 | \`frontend-developer\` |
| API Routes | \`backend-developer\` |
| DB 스키마 | \`database-specialist\` |
| 문서 | \`doc-writer\` |
| 코드 리뷰 | \`code-reviewer\` |

---

## 품질 기준

- [ ] TypeScript 에러 없음
- [ ] 반응형 디자인
- [ ] 접근성 (a11y)
- [ ] Error boundaries
- [ ] 로딩 상태

---

## 코드 컨벤션

- App Router (Next.js 13+)
- TypeScript 필수
- Server Components 기본
- 스타일: Tailwind CSS
```

### 템플릿 C: 백엔드 / API 서버

```markdown
# CLAUDE.md

## 프로젝트

[서비스명] - [간단한 설명]

## 문서 참조

| 문서 | 내용 |
|-----|------|
| [/docs/architecture.md](/docs/architecture.md) | 시스템 아키텍처 |
| [/docs/api.md](/docs/api.md) | API 엔드포인트 |
| [/docs/database.md](/docs/database.md) | 데이터베이스 스키마 |

## 개발 환경

\`\`\`bash
npm run dev      # 또는: python -m uvicorn main:app --reload
npm test
npm run build
\`\`\`

---

## 언어 규칙

| 대상 | 언어 |
|-----|-----|
| 커밋 메시지 | 영어 |
| 문서 | 영어 |
| API 응답 | 영어 |
| 로그 메시지 | 영어 |

---

## 에이전트 선택

| 작업 유형 | 에이전트 |
|----------|---------|
| API 엔드포인트 | \`backend-developer\` |
| DB 스키마/쿼리 | \`database-specialist\` |
| 문서 | \`doc-writer\` |
| 코드 리뷰 | \`code-reviewer\` |
| 아키텍처 | \`architect\` |

---

## 품질 기준

- [ ] 타입 에러 없음
- [ ] 입력 검증
- [ ] 에러 핸들링
- [ ] API 문서화
- [ ] 테스트 커버리지
```

### 템플릿 D: 최소 구성

```markdown
# CLAUDE.md

## 프로젝트

[간단한 설명]

## 개발

\`\`\`bash
[주요 명령어]
\`\`\`

## 언어 규칙

| 대상 | 언어 |
|-----|-----|
| 커밋 | 영어 |
| 문서 | 영어 |

## 에이전트

| 작업 | 에이전트 |
|-----|---------|
| 개발 | \`general-developer\` |
| 문서 | \`doc-writer\` |
| 리뷰 | \`code-reviewer\` |
```

---

## Step 3: 문서 구조 생성

`/docs/` 폴더 생성:

```bash
mkdir -p docs/architecture docs/services docs/guides
```

### 최소 구조

```
/docs/
├── architecture.md      ← 여기서 시작
└── services.md          ← 필요 시 추가
```

### 전체 구조

```
/docs/
├── architecture.md          ← 요약 + 인덱스
├── architecture/
│   ├── tech-stack.md
│   ├── data-models.md
│   ├── folder-structure.md
│   └── data-flow.md
│
├── services.md              ← 요약 + 인덱스
├── services/
│   ├── {서비스명}.md
│   └── ...
│
└── guides/
    ├── getting-started.md
    └── {주제}.md
```

---

## Step 4: 에이전트 커스터마이징

### 기술 스택에 맞게 수정

`.claude/agents/react-native-expo-developer.md` 편집:

```markdown
## Tech Stack

- **Framework**: [프레임워크]
- **Language**: [언어]
- **Database**: [데이터베이스]
- **Styling**: [스타일링]
```

### 기술 스택별 에이전트 선택

| 기술 스택 | 주요 에이전트 | 비고 |
|----------|-------------|------|
| React Native / Expo | `react-native-expo-developer` | 모바일 앱 |
| Next.js / React | `frontend-developer` | 웹 프론트엔드 |
| Node.js / Express | `backend-developer` | API 서버 |
| Python / FastAPI | `backend-developer` | API 서버 |
| 풀스택 | frontend + backend | 도메인별 분리 |

---

## 사용 가능한 리소스

### 에이전트

| 에이전트 | 용도 | 모델 |
|---------|------|------|
| `react-native-expo-developer` | 모바일 UI, 컴포넌트, 서비스 | sonnet |
| `database-specialist` | DB 스키마, 쿼리, 마이그레이션 | sonnet |
| `architect` | 시스템 설계 (분석만) | opus |
| `doc-writer` | 문서 작성 | haiku |
| `code-reviewer` | 코드 리뷰 | sonnet |
| `pm-agent` | 태스크 계획 | sonnet |

### 스킬

| 스킬 | 용도 |
|-----|------|
| `/commit` | 컨벤셔널 커밋 |
| `/lint` | 린트 및 포맷팅 |
| `/code-quality` | 전체 품질 파이프라인 |
| `/new-feature` | 단일 기능 구현 |
| `/orchestrate` | 멀티 에이전트 오케스트레이션 |
| `/plan` | 태스크 계획만 |

### 참고 문서

| 문서 | 내용 |
|-----|------|
| [Agent Assignment Guide](agents/resources/agent-assignment-guide.md) | 작업별 에이전트 매핑 |
| [Task Schema](agents/resources/task-schema.md) | 태스크 정의 형식 |
| [Documentation Guide](agents/resources/documentation-guide.md) | 문서화 원칙 |

---

## 검증

설정 후 다음 프롬프트로 테스트:

```
"이 프로젝트 구조 설명해줘"
"사용 가능한 에이전트가 뭐야?"
"새 기능은 어떻게 구현해?"
```

기대 동작:
- AI가 CLAUDE.md 참조
- 설정한 언어 사용
- 적절한 에이전트 제안

---

## 트러블슈팅

### AI가 CLAUDE.md를 무시함

- CLAUDE.md가 프로젝트 루트에 있는지 확인
- 파일이 비어있지 않은지 확인
- Claude Code 세션 재시작

### 잘못된 언어 사용

- CLAUDE.md의 언어 규칙 섹션 확인
- 충돌하는 지시사항 확인

### 에이전트를 찾을 수 없음

- `.claude/agents/`에 에이전트 파일 존재 확인
- 에이전트 이름 철자 확인 (대소문자 구분)

### 문서가 업데이트되지 않음

- `/docs/` 폴더 존재 확인
- doc-writer 에이전트의 경로 설정 확인
