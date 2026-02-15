# Receipt Tool Architecture

**단일 정보원 (Single Source of Truth)**

증빙 관리 앱의 아키텍처 문서입니다.

## 프로젝트 개요

회사 경비 청구를 위한 증빙서류 관리 Expo 앱

### 핵심 기능

- **증빙 스캔/OCR**: 카메라로 증빙 촬영 후 텍스트 자동 추출
- **통합 증빙 관리**: 개인카드, 법인카드, 기타 증빙 문서 통합 관리
- **2차원 분류**: ItemClassification × UsagePurpose
- **증빙 보관/정리**: 분류별 저장 및 검색
- **지출 관리**: 지출 내역 추적 및 통계
- **경비 청구/리포트**: 회사 경비 청구용 리포트 생성 및 내보내기

## 핵심 모델: Item (통합 모델)

### 모델 진화 과정
```
Receipt (영수증) + Document (문서) → Item (통합 증빙)
```

상세 내역: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) 참조

### Item 구조

```typescript
interface Item {
  id: string;

  // 분류 (2차원)
  classification: ItemClassification;  // personal_card | corporate_card | proof_document
  usagePurpose: UsagePurpose;         // meal | other (동적 확장 가능)

  // 기본 정보
  title: string;
  description?: string;
  amount?: number;                     // proof_document는 금액 없을 수 있음
  date: string;

  // 상점/발급처 정보
  storeName?: string;

  // 파일
  imagePath?: string;
  ocrText?: string;

  // 메타데이터
  createdAt: string;
  updatedAt: string;
}
```

### 2차원 분류 시스템

**ItemClassification (증빙 형태)**
- `personal_card`: 개인카드 (나중에 회사에 청구)
- `corporate_card`: 법인카드 (회사 카드로 직접 결제)
- `proof_document`: 기타 증빙 문서 (의료비 세부내역서, 진단서 등)

**UsagePurpose (사용 용도)**
- `meal`: 식비
- `other`: 기타
- *동적 확장 가능* (DB의 `usage_purposes` 테이블에서 관리)

### 리포트 (Report)

리포트는 여러 Item을 묶어서 경비 청구하는 단위입니다.

```typescript
interface Report {
  id: string;
  title: string;
  totalAmount: number;  // 금액이 있는 Item들의 합계
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

- Report는 여러 Item 포함 가능 (다대다 관계)
- totalAmount는 Item 중 금액이 있는 것만 합산 (proof_document는 참고 자료)

## 기술 스택

### Frontend
- **Framework**: React Native + Expo SDK 52
- **라우팅**: Expo Router (파일 기반)
- **상태 관리**: Zustand
- **스타일링**: NativeWind (Tailwind CSS for RN)
- **UI 컴포넌트**: React Native 기본 컴포넌트

### Backend/Storage
- **로컬 DB**: SQLite (expo-sqlite)
- **파일 저장**: Expo FileSystem

### OCR
- **1차**: expo-ocr (오프라인, 무료, ML Kit 기반)
- **Fallback**: Google Cloud Vision API (미래 검토)

### 개발 도구
- **TypeScript**: 타입 안전성
- **Jest**: 테스트
- **ESLint**: 코드 품질

## 데이터베이스 스키마

### 주요 테이블

#### items (통합 증빙 테이블)
```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  classification TEXT NOT NULL,  -- personal_card | corporate_card | proof_document
  usage_purpose TEXT NOT NULL,   -- meal | other | ...
  title TEXT NOT NULL,
  description TEXT,
  amount REAL,
  date TEXT NOT NULL,
  store_name TEXT,
  image_path TEXT,
  ocr_text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (classification IN ('personal_card', 'corporate_card', 'proof_document'))
);
```

#### usage_purposes (사용 용도 관리)
```sql
CREATE TABLE usage_purposes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,           -- 한글명 (예: 식비)
  name_en TEXT,                 -- 영문명 (예: meal)
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);
```

#### reports (경비 청구 리포트)
```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);
```

#### report_items (리포트-아이템 연결 테이블)
```sql
CREATE TABLE report_items (
  report_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  PRIMARY KEY (report_id, item_id),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
```

### 레거시 테이블 (유지 중)

다음 테이블들은 마이그레이션을 위해 유지:
- `receipts` - 구 영수증 테이블
- `documents` - 구 문서 테이블
- `categories` - 구 카테고리 테이블 (현재 items에서는 usage_purposes 사용)
- `report_receipts` / `report_documents` - 구 연결 테이블

상세 스키마: `/services/database/SCHEMA_DIAGRAM.md`

## 폴더 구조

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
│   │   └── [id].tsx         # 증빙 상세
│   ├── report/              # 리포트 관련 화면
│   │   ├── create.tsx       # 리포트 생성
│   │   └── [id].tsx         # 리포트 상세
│   └── _layout.tsx          # 루트 레이아웃
├── components/              # UI 컴포넌트
│   ├── item/               # Item 관련 컴포넌트
│   │   ├── ItemForm.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ItemClassificationSelector.tsx
│   │   └── UsagePurposeSelector.tsx
│   ├── report/             # Report 관련 컴포넌트
│   └── common/             # 공통 컴포넌트
├── services/               # 비즈니스 로직
│   ├── database/          # SQLite 서비스
│   │   ├── itemService.ts
│   │   ├── reportService.ts
│   │   ├── categoryService.ts (레거시)
│   │   ├── usagePurposeService.ts (TODO)
│   │   └── schema.ts
│   ├── ocr/               # OCR 서비스
│   │   ├── index.ts
│   │   ├── parser.ts
│   │   ├── logger.ts
│   │   └── errorHandler.ts
│   └── file/              # 파일 관리
├── store/                  # Zustand 상태 관리
│   ├── itemStore.ts       # Item 상태
│   ├── reportStore.ts     # Report 상태
│   ├── receiptStore.ts    # (레거시, 제거 예정)
│   └── documentStore.ts   # (레거시, 제거 예정)
├── hooks/                  # 커스텀 훅
├── utils/                  # 유틸리티 함수
├── types/                  # TypeScript 타입
│   ├── item.ts
│   ├── report.ts
│   └── shared.ts
├── constants/              # 상수
│   ├── items.ts           # ItemClassification, UsagePurpose 상수
│   └── theme.ts
└── assets/                 # 이미지, 폰트
```

## 데이터 흐름

### 증빙 추가 플로우

```
1. 사용자가 카메라로 증빙 촬영
   ↓
2. /app/item/add.tsx 화면 이동
   ↓
3. OCR 서비스로 이미지 텍스트 추출
   - expo-ocr 사용 (ML Kit)
   - 실패 시 수동 입력
   ↓
4. ItemForm에서 정보 확인/수정
   - classification 선택 (personal_card/corporate_card/proof_document)
   - usagePurpose 선택 (meal/other/...)
   - 금액, 날짜, 제목 등 입력
   ↓
5. itemService.createItem() 호출
   ↓
6. SQLite items 테이블에 저장
   ↓
7. itemStore 상태 업데이트
   ↓
8. 목록 화면으로 이동 (/items)
```

### 리포트 생성 플로우

```
1. 사용자가 리포트 생성 시작
   ↓
2. /app/report/create.tsx 화면
   ↓
3. items 목록에서 포함할 증빙 선택
   ↓
4. reportService.createReport() 호출
   - Item들 연결 (report_items 테이블)
   - totalAmount 자동 계산
   ↓
5. SQLite에 저장
   ↓
6. reportStore 상태 업데이트
   ↓
7. 리포트 상세 화면 이동 (/report/[id])
```

## 상태 관리 (Zustand)

### itemStore

```typescript
interface ItemStore {
  items: Item[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: CreateItemInput) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // Filters
  getItemsByClassification: (classification: ItemClassification) => Item[];
  getItemsByUsagePurpose: (purpose: UsagePurpose) => Item[];
  getItemsByDateRange: (start: string, end: string) => Item[];
}
```

### reportStore

```typescript
interface ReportStore {
  reports: Report[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchReports: () => Promise<void>;
  createReport: (input: CreateReportInput) => Promise<Report>;
  submitReport: (id: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;

  // Filters
  getReportsByStatus: (status: ReportStatus) => Report[];
}
```

## OCR 시스템

상세: [guides/ocr.md](./guides/ocr.md)

### 처리 흐름
1. 이미지에서 텍스트 추출 (expo-ocr)
2. 정규식으로 필드 파싱 (금액, 날짜, 상점명)
3. 신뢰도 계산 (0-1)
4. 에러 처리 및 로깅

### 에러 타입
- `IMAGE_ACCESS_ERROR`: 이미지 접근 실패
- `NO_TEXT_DETECTED`: 텍스트 미감지
- `POOR_IMAGE_QUALITY`: 이미지 품질 문제
- `PARSING_ERROR`: 파싱 실패
- `ML_KIT_INIT_ERROR`: ML Kit 초기화 실패
- `TIMEOUT_ERROR`: 타임아웃
- `UNKNOWN_ERROR`: 알 수 없는 에러

## 개발 가이드

### 새 기능 추가 시

1. **타입 정의** (`/types/`)
2. **DB 스키마 수정** (필요시) (`/services/database/schema.ts`)
3. **서비스 레이어** (`/services/database/`)
4. **Store** (`/store/`)
5. **UI 컴포넌트** (`/components/`)
6. **화면** (`/app/`)
7. **테스트** (`__tests__/`)

### 코드 컨벤션

- **언어**: 코드는 영어, 주석/문서는 한글 가능
- **컴포넌트**: PascalCase (`ItemCard.tsx`)
- **파일명**: kebab-case 또는 camelCase
- **함수**: camelCase
- **타입**: PascalCase
- **상수**: UPPER_SNAKE_CASE

### 커밋 규칙

- 단계별 작업 완료 시 반드시 커밋
- 커밋 메시지는 한글로 작성
- 형식: `[타입] 작업 내용`
  - 예: `[feat] Item 통합 모델 구현`
  - 예: `[fix] OCR 에러 처리 개선`
  - 예: `[docs] 아키텍처 문서 업데이트`

## 미구현 기능

현재 미구현 상태인 기능들: `/미구현_기능_현황_보고.md` 참조

### P0 (Critical)
- Item 편집 기능
- 홈 화면 실제 데이터 연동
- Usage Purpose 동적 관리 서비스
- 데이터 초기화 실제 동작

### P1 (High)
- Report → Item 마이그레이션 (UI 전환)
- Usage Purpose 관리 UI
- 다크 모드 지원
- Tag 시스템 UI

### P2 (Medium)
- 커스텀 필드 시스템
- 백업/복원 기능
- 카테고리 관리 UI (또는 제거)

## 기술 부채

### 레거시 시스템 정리
- `receiptStore`, `documentStore` 제거 예정
- `/app/report/create.tsx` - Item 기반으로 전환 필요
- reportService의 deprecated 함수 정리

### 타입 일관성
- UsagePurpose 타입 정의가 여러 곳에 산재
- 단일 정의로 통합 필요

## 참고 문서

- [Database Guide](./guides/database.md) - 데이터베이스 사용법
- [OCR Guide](./guides/ocr.md) - OCR 시스템 가이드
- [API Reference](./API.md) - API 레퍼런스
- [Migration Guide](./MIGRATION_GUIDE.md) - 모델 진화 과정
