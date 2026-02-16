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

### 2. 실행 방식 선택

프로젝트는 두 가지 방식으로 실행할 수 있습니다:

| 실행 방식 | 용도 | 네이티브 모듈 | 빌드 시간 |
|----------|------|-------------|----------|
| **Expo Go** | 빠른 프로토타이핑, UI 개발 | ❌ 제한적 | 없음 |
| **Development Build** | 전체 기능 테스트 (OCR, 이미지 처리) | ✅ 전체 | 초기 1회 (약 20초) |

**권장**:
- **UI 작업**: Expo Go (빠른 반복)
- **OCR/이미지 기능 테스트**: Development Build (네이티브 모듈 필요)

**Development Build가 필요한 경우**:
- ✅ OCR 스캔 기능 테스트 (ML Kit)
- ✅ 이미지 크롭/편집 기능 테스트 (react-native-image-crop-picker)
- ✅ 파일 시스템 접근
- ✅ 네이티브 성능 측정

**Expo Go로 충분한 경우**:
- ✅ UI/레이아웃 작업
- ✅ 화면 네비게이션
- ✅ 데이터베이스 쿼리
- ✅ 상태 관리

### 3. 개발 서버 실행

개발 환경에 따라 적절한 방법을 선택하세요.

---

#### 시나리오 A: 로컬 PC + 에뮬레이터 (가장 간단)

**사용 환경:**
- 개발 PC에서 직접 작업
- Android 에뮬레이터 또는 iOS 시뮬레이터 사용

**방법 1: Expo Go (빠른 시작)**
```bash
# Android 에뮬레이터에서 실행
npx expo start --android

# iOS 시뮬레이터에서 실행 (macOS만)
npx expo start --ios

# 개발 서버만 시작 (수동 선택)
npx expo start
```

**방법 2: Development Build (전체 기능)**
```bash
# Android 네이티브 빌드 및 실행
npx expo run:android

# iOS 네이티브 빌드 및 실행 (macOS만)
npx expo run:ios
```

**특징:**
- 첫 실행 시 자동으로 빌드 후 에뮬레이터에 설치
- 이후에는 Metro 서버만 재시작하면 됨
- 코드 변경 시 자동 새로고침 (Fast Refresh)

**스크린샷:**
- `/screenshot` 스킬 사용 가능 (자동 감지)

---

#### 시나리오 B: 로컬 PC + 물리 기기 (USB)

**사용 환경:**
- 개발 PC에서 직접 작업
- Android/iOS 실제 기기를 USB로 연결

**방법 1: Expo Go (빠른 시작)**
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

**방법 2: Development Build (전체 기능)**
```bash
# Android: USB로 기기 연결 후
npx expo run:android

# iOS: USB로 기기 연결 후 (macOS만)
npx expo run:ios
```

**특징:**
- ADB/Xcode가 자동으로 연결된 기기 감지
- 빌드 후 자동으로 기기에 설치 및 실행
- 이후 Metro 서버 재시작으로 개발 계속 가능

**스크린샷:**
- `/screenshot` 스킬 사용 가능 (자동 감지)

---

#### 시나리오 C: 원격 서버 + 물리 기기 (같은 Wi-Fi)

**사용 환경:**
- SSH로 원격 서버 접속하여 작업
- Android 기기와 원격 서버가 **같은 Wi-Fi 네트워크**에 연결

**전제 조건: ADB over Network 설정**

원격 환경에서는 USB 연결이 불가능하므로 먼저 ADB over Network를 설정해야 합니다.

```bash
# 1. Android 기기에서 무선 디버깅 활성화 후
# 2. 페어링 (처음 한 번만)
adb pair <기기IP>:<페어링포트>    # 예: adb pair 192.168.50.103:37847

# 3. 연결 (매번 필요)
adb connect <기기IP>:<연결포트>   # 예: adb connect 192.168.50.103:37169

# 4. 연결 확인
adb devices
```

자세한 설정 방법: [ADB over Network 가이드](./adb-network.md)

---

**방법 1: Expo Go (빠른 시작)**

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

---

**방법 2: Development Build (전체 기능)**

**중요**: Development Build는 네이티브 컴파일이 필요하므로 ADB 연결이 필수입니다.

**1단계: ADB 연결 확인**
```bash
# 연결된 기기 확인
adb devices

# 출력 예시:
# List of devices attached
# 192.168.50.103:37169    device
```

**2단계: 네이티브 빌드 및 실행**
```bash
# Android 네이티브 빌드 (자동으로 연결된 기기 감지)
npx expo run:android

# 주의: --device 플래그 사용하지 말 것
# ❌ npx expo run:android --device 192.168.50.103:37169  # 오류 발생
# ✅ npx expo run:android  # 자동 감지
```

**3단계: 빌드 완료 후**
- 자동으로 APK가 기기에 설치됨
- 개발 클라이언트로 앱 실행됨
- Metro 서버가 자동으로 시작됨 (http://<서버IP>:8081)

**4단계: 이후 개발**

빌드는 처음 한 번만 필요합니다. 이후에는:

```bash
# 방법 A: Metro 서버만 재시작
npx expo start --lan

# 방법 B: 기기에서 앱 아이콘 직접 실행
# "receipt_tool (개발)" 아이콘 탭 → Metro 서버 자동 연결
```

**특징:**
- 초기 빌드 시간: 약 20초
- OCR, 이미지 처리 등 네이티브 모듈 전체 사용 가능
- 코드 변경 시 Fast Refresh 자동 적용

**스크린샷:**
- ADB 연결 후 `/screenshot` 스킬 사용 가능

---

#### 환경별 비교

**Expo Go 방식:**

| 환경 | 개발 서버 | 기기 연결 | ADB | 스크린샷 |
|------|-----------|-----------|-----|----------|
| 로컬 + 에뮬레이터 | `npx expo start --android` | 자동 | ✅ | ✅ |
| 로컬 + USB | `npx expo start` | Expo Go 앱 | ✅ | ✅ |
| 원격 + Wi-Fi | `npx expo start --lan` | Expo Go 앱 | ⚙️ 설정 필요 | ⚙️ 설정 필요 |

**Development Build 방식:**

| 환경 | 빌드 + 실행 | 기기 연결 | ADB | 스크린샷 |
|------|-----------|-----------|-----|----------|
| 로컬 + 에뮬레이터 | `npx expo run:android` | 자동 | ✅ | ✅ |
| 로컬 + USB | `npx expo run:android` | 자동 감지 | ✅ | ✅ |
| 원격 + Wi-Fi | `npx expo run:android` | ADB over Network | ✅ 필수 | ✅ |

**권장:**
- **UI 개발**: Expo Go (빠른 반복)
- **전체 기능 테스트**: Development Build (OCR, 이미지 처리)
- **원격 작업**: Development Build + ADB over Network (완전한 개발 환경)

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
# Expo Go 방식
npx expo start              # 개발 서버 시작
npx expo start --android    # Android 에뮬레이터에서 실행
npx expo start --ios        # iOS 시뮬레이터에서 실행
npx expo start --lan        # 원격: LAN 모드

# Development Build 방식
npx expo run:android        # Android 네이티브 빌드 + 실행
npx expo run:ios            # iOS 네이티브 빌드 + 실행

# 빌드 후 Metro 서버만 재시작
npx expo start --dev-client

# 테스트
npm test
npm test -- --watch

# 타입 체크
npx tsc --noEmit

# 린트
npm run lint

# 프로덕션 빌드 (EAS)
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
