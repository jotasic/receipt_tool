# Receipt Tool Documentation

증빙 관리 앱 개발 문서 색인

## Quick Links

| 문서 | 내용 |
|-----|-----|
| [architecture.md](./architecture.md) | 아키텍처 (SSOT) |
| [api.md](./api.md) | API 레퍼런스 |
| [migration-guide.md](./migration-guide.md) | 모델 진화 히스토리 |

## Architecture

| 문서 | 내용 |
|-----|-----|
| [data-models.md](./architecture/data-models.md) | Item, Report, Tag 데이터 모델 |
| [database.md](./architecture/database.md) | DB 스키마, 테이블, 인덱스 |
| [folder-structure.md](./architecture/folder-structure.md) | 프로젝트 폴더 구조 |
| [tech-stack.md](./architecture/tech-stack.md) | 기술 스택, 코드 컨벤션 |
| [data-flow.md](./architecture/data-flow.md) | 데이터 흐름, 상태 관리 |

## API Reference

| 문서 | 내용 |
|-----|-----|
| [item-service.md](./api/item-service.md) | Item CRUD, 조회, 통계 API |
| [report-service.md](./api/report-service.md) | Report CRUD, 상태 관리 API |
| [ocr-service.md](./api/ocr-service.md) | OCR 추출, 에러 처리 API |
| [stores.md](./api/stores.md) | Zustand 스토어 |
| [types.md](./api/types.md) | TypeScript 타입 정의 |
| [database-utils.md](./api/database-utils.md) | 트랜잭션, 유지보수 |

## Guides

| 문서 | 내용 |
|-----|-----|
| [getting-started.md](./guides/getting-started.md) | 시작 가이드 |
| [development-workflow.md](./guides/development-workflow.md) | 개발 워크플로우 (CLAUDE.md 기반) |
| [database.md](./guides/database.md) | 데이터베이스 사용법 |
| [ocr.md](./guides/ocr.md) | OCR 시스템 사용법 |
| [design-system.md](./guides/design-system.md) | 디자인 시스템 사용 가이드 |
| [layout-policy.md](./guides/layout-policy.md) | 레이아웃 및 모달 정책 |

## Project Structure

```
/docs/
├── README.md                # 이 파일 (문서 색인)
├── architecture.md          # 아키텍처 요약 + 인덱스
├── api.md                   # API 요약 + 인덱스
├── migration-guide.md       # 모델 진화 가이드
│
├── architecture/            # 아키텍처 상세
│   ├── data-models.md
│   ├── database.md
│   ├── folder-structure.md
│   ├── tech-stack.md
│   └── data-flow.md
│
├── api/                     # API 상세
│   ├── item-service.md
│   ├── report-service.md
│   ├── ocr-service.md
│   ├── stores.md
│   ├── types.md
│   └── database-utils.md
│
└── guides/                  # 사용 가이드
    ├── getting-started.md
    ├── development-workflow.md
    ├── database.md
    ├── ocr.md
    ├── design-system.md
    └── layout-policy.md
```

## Quick Start

```bash
# 개발 서버
npx expo start

# 테스트
npm test

# 타입 체크
npx tsc --noEmit
```
