# OCR Service

영수증/증빙 OCR 처리 서비스

expo-ocr (ML Kit)을 사용하여 이미지에서 텍스트를 추출하고 구조화된 데이터로 파싱합니다.

## Quick Start

```typescript
import { extractReceiptData } from '@/services/ocr';
import type { OcrError } from '@/services/ocr';

try {
  const result = await extractReceiptData(imageUri);
  console.log('금액:', result.amount);
  console.log('날짜:', result.date);
  console.log('신뢰도:', result.confidence);
} catch (error) {
  const ocrError = error as OcrError;
  console.error(ocrError.userMessage);
}
```

## 상세 가이드

전체 OCR 가이드: [/docs/guides/ocr.md](/docs/guides/ocr.md)

### 포함 내용
- 에러 처리 (7가지 에러 타입)
- 로깅 시스템
- 디버깅 도구
- 정규식 패턴 (금액, 날짜, 상점명)
- 성능 모니터링
- 문제 해결

## 주요 기능

- **텍스트 추출**: expo-ocr (ML Kit 기반)
- **구조화 파싱**: 금액, 날짜, 상점명 자동 추출
- **에러 처리**: 타입별 분류 및 복구 전략
- **로깅**: 모든 처리 과정 기록
- **신뢰도 점수**: 추출 결과 정확도 측정

## 에러 타입

7가지 에러 타입 지원:
- `IMAGE_ACCESS_ERROR`: 이미지 접근 실패
- `NO_TEXT_DETECTED`: 텍스트 미감지
- `POOR_IMAGE_QUALITY`: 이미지 품질 문제
- `PARSING_ERROR`: 파싱 실패
- `ML_KIT_INIT_ERROR`: ML Kit 초기화 실패
- `TIMEOUT_ERROR`: 타임아웃
- `UNKNOWN_ERROR`: 알 수 없는 에러

상세 내용: [/docs/guides/ocr.md](/docs/guides/ocr.md)

## 파일 구조

```
services/ocr/
├── index.ts           # 메인 OCR 서비스
├── types.ts           # 타입 정의, OcrError 클래스
├── parser.ts          # 텍스트 파싱 로직
├── logger.ts          # 로깅 시스템
├── errorHandler.ts    # 에러 처리 유틸리티
├── debug.ts           # 디버깅 도구
└── README.md          # 이 파일
```
