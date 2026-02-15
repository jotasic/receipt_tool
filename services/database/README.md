# Database Service

SQLite 데이터베이스 서비스

Receipt Tool의 로컬 데이터 저장소로 SQLite를 사용합니다.

## Quick Start

```typescript
import { initDatabase, getItems, createItem } from '@/services/database';

// 초기화 (App.tsx에서 한 번만)
await initDatabase();

// Item 생성
const item = await createItem({
  classification: 'personal_card',
  usagePurpose: 'meal',
  title: '점심',
  amount: 12000,
  date: '2024-02-15',
});

// 조회
const items = await getItems();
```

## 상세 가이드

전체 데이터베이스 가이드: [/docs/guides/database.md](/docs/guides/database.md)

### 포함 내용
- 데이터 모델 설명
- 49개 서비스 API 레퍼런스
- 트랜잭션 사용법
- React Native 통합 패턴
- 에러 처리
- 성능 최적화

## API 레퍼런스

API 레퍼런스: [/docs/API.md](/docs/API.md)

## 파일 구조

```
services/database/
├── init.ts                # DB 초기화
├── schema.ts              # 테이블 정의
├── itemService.ts         # Item CRUD (12 함수)
├── reportService.ts       # Report 관리 (16 함수)
├── categoryService.ts     # Category (레거시, 7 함수)
├── utils.ts               # 유틸리티 (14 함수)
├── migrations/            # 마이그레이션
└── __tests__/             # 테스트
```

## 주요 기능

- Item (통합 증빙) CRUD
- Report (경비 청구) 관리
- 검색/필터링
- 통계 조회
- 트랜잭션 지원
- 데이터 무결성 (Foreign keys, CASCADE delete)
