# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

회사 경비 청구를 위한 영수증 관리 Expo 앱입니다.

### 핵심 기능
- **영수증 스캔/OCR**: 카메라로 영수증 촬영 후 텍스트 자동 추출
- **영수증 보관/정리**: 카테고리별 영수증 저장 및 검색
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

```
app/                    # Expo Router 파일 기반 라우팅
  (tabs)/              # 메인 탭 (홈, 영수증 목록, 리포트, 설정)
  receipt/             # 영수증 상세/편집 화면
  report/              # 리포트 생성/상세 화면
  _layout.tsx          # 루트 레이아웃
components/            # UI 컴포넌트
  receipt/             # 영수증 관련 컴포넌트
  report/              # 리포트 관련 컴포넌트
  common/              # 공통 컴포넌트
hooks/                 # 커스텀 훅
services/              # API, OCR, 스토리지 서비스
utils/                 # 유틸리티 함수
constants/             # 상수, 테마
types/                 # TypeScript 타입 정의
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

## 작업 규칙

- 단계별 작업 완료 시 반드시 커밋할 것
- 커밋 메시지는 한글로 작성
