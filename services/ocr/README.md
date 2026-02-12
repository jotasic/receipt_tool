# OCR Service - Error Handling & Logging

영수증 OCR 처리 서비스의 에러 처리 및 로깅 시스템 문서

## 목차

- [개요](#개요)
- [에러 타입](#에러-타입)
- [로깅 시스템](#로깅-시스템)
- [사용 예시](#사용-예시)
- [디버깅](#디버깅)
- [정규식 패턴](#정규식-패턴)

## 개요

OCR 서비스는 다음 기능을 제공합니다:

- **상세 에러 처리**: 에러 타입별 분류 및 사용자 친화적 메시지
- **로깅 시스템**: 모든 OCR 처리 과정 기록
- **자동 복구**: 재시도 가능 여부 판단 및 대안 제시
- **확장된 정규식 패턴**: 다양한 영수증 형식 지원

## 에러 타입

### OcrErrorType

```typescript
enum OcrErrorType {
  IMAGE_ACCESS_ERROR = 'IMAGE_ACCESS_ERROR',      // 이미지 접근 실패
  ML_KIT_INIT_ERROR = 'ML_KIT_INIT_ERROR',       // ML Kit 초기화 실패
  NO_TEXT_DETECTED = 'NO_TEXT_DETECTED',         // 텍스트 미감지
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',               // 타임아웃
  POOR_IMAGE_QUALITY = 'POOR_IMAGE_QUALITY',     // 이미지 품질 문제
  PARSING_ERROR = 'PARSING_ERROR',               // 파싱 실패
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',               // 알 수 없는 에러
}
```

### 에러별 처리 방법

| 에러 타입 | 복구 가능 | 재시도 가능 | 권장 조치 |
|----------|---------|----------|---------|
| `IMAGE_ACCESS_ERROR` | O | O | 다른 이미지 선택 또는 재촬영 |
| `ML_KIT_INIT_ERROR` | X | O | 앱 재시작 |
| `NO_TEXT_DETECTED` | O | O | 선명하게 재촬영 |
| `TIMEOUT_ERROR` | O | O | 네트워크 확인 후 재시도 |
| `POOR_IMAGE_QUALITY` | O | O | 조명 개선 후 재촬영 |
| `PARSING_ERROR` | O | X | 수동 입력 |
| `UNKNOWN_ERROR` | O | O | 재시도 또는 수동 입력 |

## 로깅 시스템

### 로그 레벨

```typescript
enum OcrLogLevel {
  DEBUG = 'DEBUG',    // 상세 디버깅 정보
  INFO = 'INFO',      // 일반 정보
  WARN = 'WARN',      // 경고
  ERROR = 'ERROR',    // 에러
}
```

### 로그 사용 예시

```typescript
import { ocrLogger } from '@/services/ocr';

// 정보 로그
ocrLogger.info('OCR 처리 시작', { imageUri });

// 경고 로그
ocrLogger.warn('일부 필드 추출 실패', { missingFields: ['금액'] });

// 에러 로그
ocrLogger.error('OCR 실패', error, { imageUri });

// 디버그 로그
ocrLogger.debug('정규식 매칭', { pattern: '합계', matched: true });
```

### 로그 조회

```typescript
// 최근 로그 10개 조회
const recentLogs = ocrLogger.getRecentLogs(10);

// 에러 로그만 조회
const errorLogs = ocrLogger.getErrorLogs();

// 전체 로그 JSON으로 내보내기
const logsJson = ocrLogger.exportLogs();
```

## 사용 예시

### 기본 OCR 처리

```typescript
import { extractReceiptData, OcrErrorType } from '@/services/ocr';
import type { OcrError } from '@/services/ocr';

try {
  const receipt = await extractReceiptData(imageUri);

  console.log('상호명:', receipt.storeName);
  console.log('금액:', receipt.amount);
  console.log('날짜:', receipt.date);
  console.log('신뢰도:', receipt.confidence);

  // 경고 처리
  if (receipt.warnings && receipt.warnings.length > 0) {
    console.warn('경고:', receipt.warnings);
  }
} catch (error) {
  if (error && typeof error === 'object' && 'type' in error) {
    const ocrError = error as OcrError;

    // 에러 타입별 처리
    switch (ocrError.type) {
      case OcrErrorType.NO_TEXT_DETECTED:
        alert('영수증이 선명하게 보이도록 다시 촬영해주세요');
        break;

      case OcrErrorType.PARSING_ERROR:
        alert('정보를 수동으로 입력해주세요');
        break;

      default:
        if (ocrError.retryable) {
          // 재시도 옵션 제공
          alert(`${ocrError.userMessage}\n\n다시 시도하시겠습니까?`);
        } else {
          alert(ocrError.userMessage);
        }
    }
  }
}
```

### 에러 처리 with Alert

```typescript
const handleOcrError = (error: OcrError) => {
  const buttons = [];

  if (error.retryable) {
    buttons.push({
      text: '다시 시도',
      onPress: () => runOCR(),
    });
  }

  if (
    error.type === OcrErrorType.NO_TEXT_DETECTED ||
    error.type === OcrErrorType.POOR_IMAGE_QUALITY
  ) {
    buttons.push({
      text: '다시 촬영',
      onPress: () => router.back(),
    });
  }

  buttons.push({
    text: '수동 입력',
    style: 'cancel',
  });

  Alert.alert(
    'OCR 처리 실패',
    `${error.userMessage}\n\n${error.suggestedAction || ''}`,
    buttons
  );
};
```

## 디버깅

### 디버그 정보 출력

```typescript
import { printOcrDebugInfo, getOcrStatistics } from '@/services/ocr';

// 콘솔에 디버그 정보 출력
printOcrDebugInfo();

// 통계 정보 가져오기
const stats = getOcrStatistics();
console.log('성공률:', `${stats.successRate * 100}%`);
console.log('에러 분포:', stats.errorDistribution);
```

### 로그 파일로 내보내기

```typescript
import { exportOcrLogs } from '@/services/ocr';

// 로그를 파일로 저장
const filePath = await exportOcrLogs();
console.log('로그 저장 위치:', filePath);
```

### 로그 초기화

```typescript
import { clearOcrLogs } from '@/services/ocr';

// 로그 초기화 (테스트용)
clearOcrLogs();
```

## 정규식 패턴

### 금액 추출 패턴 (우선순위 순)

1. **합계/총액/결제금액** (가장 신뢰도 높음)
   - `합계: 5,000`
   - `총액 10000`
   - `결제금액: 3,500`

2. **카드/현금 결제**
   - `카드: 15,000`
   - `현금 20000`

3. **영문 패턴**
   - `TOTAL: 8,000`
   - `AMOUNT 12000`

4. **통화 기호**
   - `₩ 6,000`
   - `\ 9,500`

5. **원 단위**
   - `5,000원`
   - `10000 원`

### 날짜 추출 패턴

1. **YYYY-MM-DD 형식**
   - `2024-01-15`
   - `2024.01.15`
   - `2024/01/15`

2. **한글 포함**
   - `2024년 1월 15일`
   - `24년1월15일`

3. **YY-MM-DD 형식**
   - `24-01-15`
   - `24.1.15`

4. **시간 포함** (날짜 부분만 추출)
   - `2024-01-15 14:30`

### 상호명 추출 방법

1. **첫 줄 추출** (가장 일반적)
2. **키워드 찾기** (`상호:`, `사업자:`)
3. **두 번째 줄** (첫 줄이 로고인 경우)

## 성능 모니터링

### 신뢰도 점수

파싱된 영수증의 `confidence` 필드는 0-1 사이 값으로 계산됩니다:

- **0.7 이상**: 높은 신뢰도 (모든 필드 추출 성공)
- **0.4 ~ 0.7**: 중간 신뢰도 (일부 필드 추출)
- **0.4 미만**: 낮은 신뢰도 (대부분 수동 입력 필요)

### 경고 메시지

파싱 중 발생한 경고는 `warnings` 배열에 저장됩니다:

```typescript
const result = await extractReceiptData(imageUri);

if (result.warnings && result.warnings.length > 0) {
  result.warnings.forEach(warning => {
    console.warn(warning);
    // 예: "금액을 찾을 수 없습니다"
  });
}
```

## 문제 해결

### 자주 발생하는 문제

1. **텍스트 미감지**
   - 원인: 이미지가 흐리거나 어두움
   - 해결: 조명이 밝은 곳에서 재촬영

2. **금액 추출 실패**
   - 원인: 특이한 포맷 (예: "5천원")
   - 해결: parser.ts의 정규식 패턴 추가

3. **날짜 형식 인식 실패**
   - 원인: 비표준 날짜 형식
   - 해결: parser.ts의 datePatterns 확장

### 패턴 추가 방법

`/services/ocr/parser.ts` 파일의 정규식 배열에 새 패턴 추가:

```typescript
const amountPatterns = [
  // 기존 패턴...
  { pattern: /새로운패턴[:\s]*([0-9,]+)/i, name: '새패턴' },
];
```

## 파일 구조

```
services/ocr/
├── index.ts           # 메인 OCR 서비스
├── types.ts           # 타입 정의 및 OcrError 클래스
├── parser.ts          # 영수증 텍스트 파싱 로직
├── logger.ts          # 로깅 시스템
├── errorHandler.ts    # 에러 처리 유틸리티
├── debug.ts           # 디버깅 도구
└── README.md          # 문서
```
