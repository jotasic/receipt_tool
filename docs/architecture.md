# Receipt Tool Architecture

**단일 정보원 (Single Source of Truth)**

증빙 관리 앱의 아키텍처 문서입니다.

## Quick Reference

| 항목 | 내용 |
|-----|-----|
| 플랫폼 | React Native + Expo SDK 52 |
| 라우팅 | Expo Router (파일 기반) |
| 상태 관리 | Zustand |
| DB | SQLite (expo-sqlite) |
| 스타일 | NativeWind (Tailwind CSS) |
| 디자인 시스템 | 토큰 + 레이아웃 컴포넌트 + 훅 |
| OCR | expo-ocr (ML Kit) |

---

## 프로젝트 개요

회사 경비 청구를 위한 증빙서류 관리 앱

### 핵심 기능

- **증빙 스캔/OCR**: 카메라로 증빙 촬영 후 텍스트 자동 추출
- **통합 증빙 관리**: 개인카드, 법인카드, 기타 증빙 문서 통합 관리
- **2차원 분류**: ItemClassification × UsagePurpose
- **경비 청구/리포트**: 회사 경비 청구용 리포트 생성

---

## 상세 문서

| 문서 | 내용 |
|-----|-----|
| [data-models.md](./architecture/data-models.md) | Item, Report, Tag 등 데이터 모델 |
| [database.md](./architecture/database.md) | DB 스키마, 테이블, 인덱스 |
| [folder-structure.md](./architecture/folder-structure.md) | 프로젝트 폴더 구조 |
| [tech-stack.md](./architecture/tech-stack.md) | 기술 스택, 코드 컨벤션 |
| [data-flow.md](./architecture/data-flow.md) | 데이터 흐름, 상태 관리 |
| [design-system.md](./architecture/design-system.md) | 디자인 시스템 구조, 토큰, 레이아웃 컴포넌트, DatePickerInput |
| [routing-structure.md](./architecture/routing-structure.md) | 라우팅 구조 및 네비게이션 패턴 |
| [calendar-tab.md](./architecture/calendar-tab.md) | 달력 탭 구조, 날짜 범위 제한 (±3개월) |
| [reports-screen.md](./architecture/reports-screen.md) | 정산 탭 구조, useFocusEffect 활용 |

---

## 핵심 모델 요약

### Item (통합 증빙)

```typescript
interface Item {
  id: string;
  classification: 'personal_card' | 'corporate_card' | 'proof_document';
  usagePurpose: 'meal' | 'other' | ...;
  title: string;
  amount?: number;
  date: string;
  // ...
}
```

### 2차원 분류 시스템

| 분류 | 값 |
|-----|-----|
| **Classification** | personal_card, corporate_card, proof_document |
| **UsagePurpose** | meal, other (동적 확장 가능) |

상세: [data-models.md](./architecture/data-models.md)

---

## 참고 문서

- [API Reference](./api.md) - API 레퍼런스
- [Migration Guide](./migration-guide.md) - 모델 진화 과정
- [Database Guide](./guides/database.md) - 데이터베이스 사용법
- [OCR Guide](./guides/ocr.md) - OCR 시스템 가이드
