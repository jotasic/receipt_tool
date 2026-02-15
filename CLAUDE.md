# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

회사 경비 청구를 위한 증빙서류 관리 Expo 앱입니다.

### 핵심 기능
- **증빙 스캔/OCR**: 카메라로 증빙 촬영 후 텍스트 자동 추출
- **통합 증빙 관리**: 개인카드, 법인카드, 기타 증빙 문서 통합 관리 (Item 모델)
- **2차원 분류**: ItemClassification × UsagePurpose
- **증빙 보관/정리**: 분류별 저장 및 검색
- **지출 관리**: 지출 내역 추적 및 통계
- **경비 청구/리포트**: 회사 경비 청구용 리포트 생성 및 내보내기

## 개발 명령어

```bash
# 개발 서버
npx expo start
npx expo start --ios
npx expo start --android

# 테스트
npm test
npm test -- --testPathPattern="파일명"

# 린트/타입체크
npm run lint
npx tsc --noEmit

# 빌드 (EAS)
eas build --platform ios
eas build --platform android
```

## 아키텍처

상세 아키텍처: [/docs/ARCHITECTURE.md](/docs/ARCHITECTURE.md)

```
app/                    # Expo Router 파일 기반 라우팅
  (tabs)/              # 메인 탭 (홈, 증빙 목록, 캘린더, 리포트, 설정)
  item/                # 증빙 추가/상세 화면
  report/              # 리포트 생성/상세 화면
  _layout.tsx          # 루트 레이아웃
components/            # UI 컴포넌트
  item/                # Item 관련 컴포넌트
  report/              # 리포트 관련 컴포넌트
  common/              # 공통 컴포넌트
services/              # 비즈니스 로직
  database/            # SQLite 서비스
  ocr/                 # OCR 서비스
  file/                # 파일 관리
store/                 # Zustand 상태 관리
types/                 # TypeScript 타입 정의
constants/             # 상수, 테마
utils/                 # 유틸리티 함수
assets/                # 이미지, 폰트
```

## 주요 기술 스택

- **Expo Camera**: 영수증 촬영
- **OCR**: expo-ocr (1차) → Google Cloud Vision API (fallback)
- **로컬 저장소**: expo-sqlite 또는 AsyncStorage
- **상태 관리**: Zustand
- **스타일링**: NativeWind (Tailwind CSS)

### OCR 전략
1. **expo-ocr** 우선 사용 (오프라인, 무료)
2. 인식률 부족 시 **Google Cloud Vision API**로 전환 검토

## 데이터 모델

상세: [/docs/ARCHITECTURE.md](/docs/ARCHITECTURE.md)

### Item (통합 증빙)
**2차원 분류 시스템:**
- **ItemClassification** (증빙 형태):
  - `personal_card`: 개인카드
  - `corporate_card`: 법인카드
  - `proof_document`: 기타 증빙 문서
- **UsagePurpose** (사용 용도):
  - `meal`: 식비
  - `other`: 기타
  - (동적 확장 가능)

### Report (경비 청구)
- 여러 Item을 묶어서 경비 청구하는 단위
- 상태: `draft` → `submitted` → `approved` / `rejected`
- totalAmount는 금액이 있는 Item만 합산

## 에이전트 활용

| 작업 | 에이전트 |
|------|----------|
| Expo/RN 개발 | `react-native-expo-developer` |
| UI 구현 | `frontend-developer` |
| API 설계 | `api-designer` |
| 테스트 작성 | `test-writer` |
| DB 설계 | `database-specialist` |
| 코드 리뷰 | `code-reviewer` |

## 코드 컨벤션

- Expo Router (파일 기반 라우팅)
- TypeScript 필수
- 함수형 컴포넌트 + React Hooks
- 컴포넌트명: PascalCase
- 파일명: kebab-case 또는 camelCase

## 문서

- **아키텍처 SSOT**: [/docs/ARCHITECTURE.md](/docs/ARCHITECTURE.md)
- **API 레퍼런스**: [/docs/API.md](/docs/API.md)
- **데이터베이스**: [/docs/guides/database.md](/docs/guides/database.md)
- **OCR 시스템**: [/docs/guides/ocr.md](/docs/guides/ocr.md)
- **모델 진화**: [/docs/MIGRATION_GUIDE.md](/docs/MIGRATION_GUIDE.md)
- **미구현 기능**: [/미구현_기능_현황_보고.md](/미구현_기능_현황_보고.md)

## 작업 규칙

- 단계별 작업 완료 시 반드시 커밋할 것
- 커밋 메시지는 한글로 작성
- 문서 업데이트 시 `/docs/ARCHITECTURE.md`가 SSOT임을 기억
