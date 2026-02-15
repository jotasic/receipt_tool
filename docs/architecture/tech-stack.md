# Tech Stack

기술 스택 및 개발 도구

## Frontend

| 기술 | 용도 |
|-----|-----|
| React Native | 크로스 플랫폼 모바일 앱 |
| Expo SDK 52 | React Native 개발 플랫폼 |
| Expo Router | 파일 기반 라우팅 |
| Zustand | 상태 관리 |
| NativeWind | Tailwind CSS for RN |

## Backend/Storage

| 기술 | 용도 |
|-----|-----|
| SQLite (expo-sqlite) | 로컬 데이터베이스 |
| Expo FileSystem | 파일 저장 |
| AsyncStorage | 설정 저장 |

## OCR

| 기술 | 용도 |
|-----|-----|
| expo-ocr | 오프라인 OCR (ML Kit 기반) |
| Google Cloud Vision | Fallback (미래 검토) |

## 개발 도구

| 도구 | 용도 |
|-----|-----|
| TypeScript | 타입 안전성 |
| Jest | 테스트 |
| ESLint | 코드 품질 |

---

## 코드 컨벤션

| 항목 | 규칙 |
|-----|-----|
| 컴포넌트 | PascalCase (`ItemCard.tsx`) |
| 파일명 | kebab-case 또는 camelCase |
| 함수 | camelCase |
| 타입 | PascalCase |
| 상수 | UPPER_SNAKE_CASE |
| 언어 | 코드: 영어, 주석/문서: 한글 가능 |

---

## 플랫폼 지원

| 플랫폼 | 상태 |
|-------|------|
| Android | ✅ 주 개발 타겟 |
| iOS | ⚠️ 호환성 고려 (Platform.OS 분기) |
