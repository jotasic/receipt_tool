# Folder Structure

프로젝트 폴더 구조

```
receipt_tool/
├── app/                      # Expo Router (파일 기반 라우팅)
│   ├── (tabs)/              # 메인 탭 화면
│   │   ├── index.tsx        # 홈 (대시보드)
│   │   ├── items.tsx        # 증빙 목록
│   │   ├── calendar.tsx     # 캘린더 뷰
│   │   ├── reports.tsx      # 리포트 목록
│   │   └── settings.tsx     # 설정
│   ├── item/                # 증빙 관련 화면
│   │   ├── add.tsx          # 증빙 추가 (OCR)
│   │   ├── edit.tsx         # 증빙 편집
│   │   └── [id].tsx         # 증빙 상세
│   ├── report/              # 리포트 관련 화면
│   │   ├── create.tsx       # 리포트 생성
│   │   └── [id].tsx         # 리포트 상세
│   ├── settings/            # 설정 서브 화면
│   │   ├── tags.tsx         # 태그 관리
│   │   ├── usage-purposes.tsx  # 사용 용도 관리
│   │   ├── custom-fields.tsx   # 커스텀 필드 관리
│   │   └── backup.tsx       # 백업/복원
│   └── _layout.tsx          # 루트 레이아웃
│
├── components/              # UI 컴포넌트
│   ├── item/               # Item 관련 컴포넌트
│   │   ├── ItemForm.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ItemClassificationSelector.tsx
│   │   ├── UsagePurposeSelector.tsx
│   │   ├── TagSelector.tsx
│   │   └── CustomFieldInput.tsx
│   ├── report/             # Report 관련 컴포넌트
│   └── common/             # 공통 컴포넌트
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Calendar.tsx
│       ├── IconPicker.tsx
│       └── ColorPicker.tsx
│
├── services/               # 비즈니스 로직
│   ├── database/          # SQLite 서비스
│   │   ├── init.ts        # DB 초기화
│   │   ├── itemService.ts
│   │   ├── reportService.ts
│   │   ├── tagService.ts
│   │   ├── usagePurposeService.ts
│   │   ├── customFieldService.ts
│   │   ├── categoryService.ts  # (레거시)
│   │   └── migrations/    # 마이그레이션 스크립트
│   ├── ocr/               # OCR 서비스
│   │   ├── index.ts
│   │   ├── parser.ts
│   │   ├── logger.ts
│   │   └── errorHandler.ts
│   ├── backup/            # 백업/복원 서비스
│   │   └── index.ts
│   └── file/              # 파일 관리
│
├── store/                  # Zustand 상태 관리
│   ├── itemStore.ts       # Item 상태
│   ├── reportStore.ts     # Report 상태
│   ├── receiptStore.ts    # (레거시)
│   └── documentStore.ts   # (레거시)
│
├── hooks/                  # 커스텀 훅
├── utils/                  # 유틸리티 함수
│
├── types/                  # TypeScript 타입
│   ├── item.ts
│   ├── report.ts
│   ├── tag.ts
│   └── shared.ts
│
├── constants/              # 상수
│   ├── items.ts           # ItemClassification, UsagePurpose 상수
│   ├── Colors.ts          # 테마 색상
│   └── theme.ts
│
├── docs/                   # 문서
│   ├── architecture.md
│   ├── api.md
│   └── ...
│
└── assets/                 # 이미지, 폰트
```

---

## 주요 디렉토리 설명

### app/

Expo Router 기반 파일 라우팅. 파일 구조가 곧 URL 구조.

| 경로 | URL |
|-----|-----|
| `app/(tabs)/items.tsx` | `/items` |
| `app/item/[id].tsx` | `/item/123` |
| `app/settings/tags.tsx` | `/settings/tags` |

### components/

재사용 가능한 UI 컴포넌트. 도메인별로 분류.

### services/

비즈니스 로직. DB, OCR, 파일 등 외부 시스템과 상호작용.

### store/

Zustand 기반 전역 상태 관리. 각 도메인별 store.

### types/

TypeScript 타입 정의. 도메인별 분리.
