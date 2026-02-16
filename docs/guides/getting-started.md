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

개발 환경에 따라 적절한 방법을 선택하세요.

---

#### 시나리오 A: 로컬 PC + 에뮬레이터 (가장 간단)

**사용 환경:**
- 개발 PC에서 직접 작업
- Android 에뮬레이터 또는 iOS 시뮬레이터 사용

**실행 방법:**
```bash
# Android 에뮬레이터에서 실행
npx expo start --android

# iOS 시뮬레이터에서 실행 (macOS만)
npx expo start --ios

# 개발 서버만 시작 (수동 선택)
npx expo start
```

**스크린샷:**
- `/screenshot` 스킬 사용 가능 (자동 감지)

---

#### 시나리오 B: 로컬 PC + 물리 기기 (USB)

**사용 환경:**
- 개발 PC에서 직접 작업
- Android/iOS 실제 기기를 USB로 연결

**실행 방법:**
```bash
# 1. USB로 기기 연결
# 2. 개발 서버 시작
npx expo start

# 3. 터미널에서 'a' (Android) 또는 'i' (iOS) 입력
# 또는 Expo Go 앱 실행 후 프로젝트 선택
```

**Android 기기에서:**
- **Expo Go** 앱 설치 필요
- 앱 실행 후 자동으로 개발 서버 감지
- 또는 QR 코드 스캔

**스크린샷:**
- `/screenshot` 스킬 사용 가능 (자동 감지)

---

#### 시나리오 C: 원격 서버 + 물리 기기 (같은 Wi-Fi)

**사용 환경:**
- SSH로 원격 서버 접속하여 작업
- Android 기기와 원격 서버가 **같은 Wi-Fi 네트워크**에 연결

**실행 방법:**

**1단계: 개발 서버 시작**
```bash
# LAN 모드로 개발 서버 시작
npx expo start --lan
```

**2단계: Android 기기에서 Expo Go 실행**
- **Expo Go** 앱 실행
- 홈 화면에서 자동으로 개발 서버 감지
- "receipt_tool" 프로젝트 탭하여 실행

**또는 수동 연결:**
- Expo Go에서 "Enter URL manually"
- 서버 IP 확인: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- URL 입력: `exp://<서버IP>:8081` (예: `exp://192.168.50.43:8081`)

**3단계: ADB over Network 설정 (스크린샷용)**

원격 환경에서 스크린샷 등 ADB 명령어를 사용하려면:

```bash
# Android 기기에서 무선 디버깅 활성화 후
adb pair <기기IP>:<페어링포트>    # 처음 한 번만
adb connect <기기IP>:<연결포트>   # 매번 연결

# 예시
adb pair 192.168.50.103:37847     # 코드 입력 필요
adb connect 192.168.50.103:37169
```

자세한 설정 방법: [ADB over Network 가이드](./adb-network.md)

**스크린샷:**
- ADB 연결 후 `/screenshot` 스킬 사용 가능

---

#### 환경별 비교

| 환경 | 개발 서버 | 기기 연결 | ADB | 스크린샷 |
|------|-----------|-----------|-----|----------|
| 로컬 + 에뮬레이터 | `npx expo start --android` | 자동 | ✅ | ✅ |
| 로컬 + USB | `npx expo start` | Expo Go | ✅ | ✅ |
| 원격 + Wi-Fi | `npx expo start --lan` | Expo Go | ⚙️ 설정 필요 | ⚙️ 설정 필요 |

**권장:**
- **단독 개발**: 시나리오 A (에뮬레이터) - 가장 간단
- **실제 기기 테스트**: 시나리오 B (USB) - 중간
- **원격 작업**: 시나리오 C (Wi-Fi) - 초기 설정 필요

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
