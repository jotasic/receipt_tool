# Receipt Tool Documentation

증빙 관리 앱 개발 문서 색인

## Quick Links

- [Architecture](./ARCHITECTURE.md) - 프로젝트 아키텍처 (단일 정보원)
- [API Reference](./API.md) - API 레퍼런스
- [Migration Guide](./MIGRATION_GUIDE.md) - Receipt→Document→Item 진화 과정

## Guides

- [Getting Started](./guides/getting-started.md) - 시작 가이드
- [Database Guide](./guides/database.md) - 데이터베이스 사용법
- [OCR Guide](./guides/ocr.md) - OCR 시스템 사용법

## Archived Documents

완료된 작업 리포트는 [archived/](./archived/) 폴더 참조

## Project Structure

```
/docs/
├── README.md              # 이 파일 (문서 색인)
├── ARCHITECTURE.md        # 아키텍처 SSOT
├── API.md                 # API 레퍼런스
├── MIGRATION_GUIDE.md     # 모델 진화 가이드
├── guides/
│   ├── getting-started.md # 시작 가이드
│   ├── database.md        # 데이터베이스 가이드
│   └── ocr.md             # OCR 가이드
└── archived/              # 완료된 작업 문서
    └── ...
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

## For Developers

- 새 기능 구현: [ARCHITECTURE.md](./ARCHITECTURE.md)에서 현재 구조 확인
- 데이터베이스 작업: [guides/database.md](./guides/database.md) 참조
- OCR 연동: [guides/ocr.md](./guides/ocr.md) 참조
- API 사용: [API.md](./API.md) 참조

## Documentation Updates

문서 업데이트 시:
1. 해당 가이드 파일 수정
2. ARCHITECTURE.md가 SSOT임을 기억
3. 중복 정보 작성 금지
4. 언어 일관성 유지 (한글 또는 영어)
