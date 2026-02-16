# Getting Started

Receipt Tool 개발 시작 가이드

## 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Expo CLI
- iOS 시뮬레이터 (macOS) 또는 Android 에뮬레이터

## 설치

### 1. 의존성 설치

```bash
cd receipt_tool
npm install
```

### 2. 개발 서버 실행

**로컬 환경:**
```bash
# 개발 서버 시작
npx expo start

# iOS 시뮬레이터에서 실행
npx expo start --ios

# Android 에뮬레이터에서 실행
npx expo start --android
```

**원격 환경 (SSH):**
```bash
# 터널 모드로 개발 서버 시작
npx expo start --tunnel --android
```

원격 환경에서 스크린샷 등 ADB 명령어를 사용하려면 [ADB over Network 설정](./adb-network.md)이 필요합니다.

### 3. 테스트 실행

```bash
# 전체 테스트
npm test

# 특정 파일 테스트
npm test -- --testPathPattern="itemService"

# Watch 모드
npm test -- --watch
```

### 4. 타입 체크

```bash
# TypeScript 타입 체크
npx tsc --noEmit

# ESLint 실행
npm run lint
```

## 프로젝트 구조

```
receipt_tool/
├── app/                    # 화면 (Expo Router)
├── components/             # UI 컴포넌트
├── services/              # 비즈니스 로직
│   ├── database/          # SQLite 서비스
│   ├── ocr/               # OCR 서비스
│   └── file/              # 파일 관리
├── store/                 # Zustand 상태 관리
├── types/                 # TypeScript 타입
├── constants/             # 상수
└── utils/                 # 유틸리티
```

## 주요 개념

### Item (통합 증빙)

증빙은 3가지로 분류됩니다:

- `personal_card`: 개인카드
- `corporate_card`: 법인카드
- `proof_document`: 기타 증빙 문서

각 증빙은 사용 용도(`usagePurpose`)를 가집니다:

- `meal`: 식비
- `other`: 기타
- (동적 확장 가능)

### Report (경비 청구)

여러 Item을 묶어서 경비 청구하는 단위입니다.

상태: `draft` → `submitted` → `approved` / `rejected`

## 첫 기능 개발

### 1. 데이터 모델 확인

`/types/item.ts`에서 Item 타입 확인:

```typescript
interface Item {
  id: string;
  classification: ItemClassification;
  usagePurpose: UsagePurpose;
  title: string;
  amount?: number;
  date: string;
  // ...
}
```

### 2. 서비스 레이어 사용

```typescript
import { createItem, getItems } from '@/services/database';

// Item 생성
const item = await createItem({
  classification: 'personal_card',
  usagePurpose: 'meal',
  title: '점심 식사',
  amount: 12000,
  date: '2024-02-15',
});

// 조회
const items = await getItems();
```

### 3. Store 사용

```typescript
import { useItemStore } from '@/store/itemStore';

function MyComponent() {
  const { items, fetchItems } = useItemStore();

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemCard item={item} />}
    />
  );
}
```

### 4. 화면 추가

Expo Router는 파일 기반 라우팅을 사용합니다:

- `/app/(tabs)/index.tsx` → 홈 화면
- `/app/item/add.tsx` → Item 추가 화면
- `/app/item/[id].tsx` → Item 상세 화면

## 개발 명령어

```bash
# 개발 서버
npx expo start
npx expo start --ios
npx expo start --android

# 테스트
npm test
npm test -- --watch

# 타입 체크
npx tsc --noEmit

# 린트
npm run lint

# 빌드
eas build --platform ios
eas build --platform android
```

## 다음 단계

- [Architecture](../ARCHITECTURE.md) - 프로젝트 아키텍처 이해
- [Database Guide](./database.md) - 데이터베이스 사용법
- [OCR Guide](./ocr.md) - OCR 시스템 사용법

## 도움이 필요하면

- 아키텍처 질문: [ARCHITECTURE.md](../ARCHITECTURE.md)
- API 사용법: [API.md](../API.md)
- 미구현 기능 확인: `/미구현_기능_현황_보고.md`
