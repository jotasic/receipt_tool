# OCR Service Guide

영수증/증빙 OCR 처리 서비스 가이드

## 목차

- [개요](#개요)
- [Quick Start](#quick-start)
- [에러 처리](#에러-처리)
- [로깅 시스템](#로깅-시스템)
- [디버깅](#디버깅)
- [정규식 패턴](#정규식-패턴)
- [성능 모니터링](#성능-모니터링)

## 개요

OCR 서비스는 증빙 이미지에서 텍스트를 추출하고 구조화된 데이터로 파싱합니다.

### 주요 기능

- **텍스트 추출**: expo-ocr (ML Kit 기반)
- **구조화 파싱**: 금액, 날짜, 상점명 등 자동 추출
- **에러 처리**: 7가지 에러 타입별 분류 및 복구 전략
- **로깅**: 모든 처리 과정 기록 및 디버깅 지원
- **신뢰도 점수**: 추출 결과의 정확도 측정

### 기술 스택

- **expo-ocr**: 오프라인 OCR (무료, ML Kit)
- **정규식**: 다양한 영수증 포맷 지원 (10+ 패턴)

## Quick Start

### 기본 사용

```typescript
import { extractReceiptData } from '@/services/ocr';
import type { OcrError } from '@/services/ocr';

try {
  const result = await extractReceiptData(imageUri);

  console.log('상호명:', result.storeName);
  console.log('금액:', result.amount);
  console.log('날짜:', result.date);
  console.log('신뢰도:', result.confidence); // 0-1

  // 경고 확인
  if (result.warnings && result.warnings.length > 0) {
    console.warn('일부 필드 추출 실패:', result.warnings);
  }
} catch (error) {
  const ocrError = error as OcrError;
  console.error(ocrError.userMessage);
}
```

### ItemForm에서 사용

```typescript
import { useState } from 'react';
import { extractReceiptData, OcrErrorType } from '@/services/ocr';

function ItemForm({ imageUri }: { imageUri: string }) {
  const [ocrError, setOcrError] = useState<OcrError | null>(null);
  const [confidence, setConfidence] = useState(0);

  const runOCR = async () => {
    try {
      const result = await extractReceiptData(imageUri);

      // 폼 자동 채우기
      setStoreName(result.storeName || '');
      setAmount(result.amount?.toString() || '');
      setDate(result.date || '');

      setConfidence(result.confidence || 0);
      setOcrError(null);
    } catch (error) {
      setOcrError(error as OcrError);
      handleOcrError(error as OcrError);
    }
  };

  return (
    <View>
      {/* Error banner */}
      {ocrError && (
        <View className="bg-red-50 border border-red-200 p-4 mb-4">
          <Text className="text-red-700">{ocrError.userMessage}</Text>
        </View>
      )}

      {/* Confidence indicator */}
      {confidence > 0 && !ocrError && (
        <View className={
          confidence >= 0.7 ? 'bg-green-50' :
          confidence >= 0.4 ? 'bg-yellow-50' :
          'bg-orange-50'
        }>
          <Text>OCR 신뢰도: {Math.round(confidence * 100)}%</Text>
        </View>
      )}

      {/* Form fields */}
    </View>
  );
}
```

## 에러 처리

### 에러 타입

| 에러 타입 | 설명 | 복구 가능 | 재시도 가능 | 권장 조치 |
|----------|------|----------|----------|---------|
| `IMAGE_ACCESS_ERROR` | 이미지 파일 접근 실패 | O | O | 다른 이미지 선택 |
| `ML_KIT_INIT_ERROR` | ML Kit 초기화 실패 | X | O | 앱 재시작 |
| `NO_TEXT_DETECTED` | 텍스트 미감지 | O | O | 선명하게 재촬영 |
| `TIMEOUT_ERROR` | 처리 시간 초과 | O | O | 네트워크 확인 |
| `POOR_IMAGE_QUALITY` | 이미지가 흐리거나 어두움 | O | O | 조명 개선 후 재촬영 |
| `PARSING_ERROR` | 필수 필드 추출 실패 | O | X | 수동 입력 |
| `UNKNOWN_ERROR` | 알 수 없는 에러 | O | O | 재시도 또는 수동 입력 |

### 에러 처리 패턴

```typescript
import { OcrErrorType } from '@/services/ocr';
import { Alert } from 'react-native';

function handleOcrError(error: OcrError) {
  const buttons = [];

  // 재시도 가능한 경우
  if (error.retryable) {
    buttons.push({
      text: '다시 시도',
      onPress: () => runOCR(),
    });
  }

  // 이미지 품질 문제인 경우
  if (
    error.type === OcrErrorType.NO_TEXT_DETECTED ||
    error.type === OcrErrorType.POOR_IMAGE_QUALITY
  ) {
    buttons.push({
      text: '다시 촬영',
      onPress: () => router.back(),
    });
  }

  // 항상 수동 입력 옵션 제공
  buttons.push({
    text: '수동 입력',
    style: 'cancel',
  });

  Alert.alert(
    'OCR 처리 실패',
    error.userMessage,
    buttons
  );
}
```

### 에러 타입별 처리

```typescript
switch (error.type) {
  case OcrErrorType.IMAGE_ACCESS_ERROR:
    // 이미지 파일이 없거나 접근 불가
    // → 다른 이미지 선택
    break;

  case OcrErrorType.NO_TEXT_DETECTED:
    // 텍스트를 찾을 수 없음
    // → 조명 밝게 하고 재촬영
    break;

  case OcrErrorType.POOR_IMAGE_QUALITY:
    // 이미지가 흐리거나 어두움
    // → 선명하게 재촬영
    break;

  case OcrErrorType.PARSING_ERROR:
    // 텍스트는 추출했으나 필드 파싱 실패
    // → 수동 입력
    break;

  case OcrErrorType.ML_KIT_INIT_ERROR:
    // ML Kit 초기화 실패
    // → 앱 재시작
    break;

  case OcrErrorType.TIMEOUT_ERROR:
    // 처리 시간 초과
    // → 네트워크 확인 후 재시도
    break;

  default:
    // 알 수 없는 에러
    // → 재시도 또는 수동 입력
    break;
}
```

## 로깅 시스템

### 로그 레벨

```typescript
enum OcrLogLevel {
  DEBUG = 'DEBUG',   // 상세 디버깅 정보 (정규식 매칭 등)
  INFO = 'INFO',     // 일반 처리 정보 (시작/완료)
  WARN = 'WARN',     // 경고 (일부 필드 추출 실패)
  ERROR = 'ERROR',   // 에러
}
```

### 로그 사용

```typescript
import { ocrLogger } from '@/services/ocr';

// 정보 로그
ocrLogger.info('OCR 처리 시작', { imageUri });

// 경고 로그
ocrLogger.warn('일부 필드 추출 실패', { missingFields: ['amount'] });

// 에러 로그
ocrLogger.error('OCR 실패', error, { context: 'extractReceiptData' });

// 디버그 로그 (개발 중에만)
ocrLogger.debug('정규식 매칭 성공', { pattern: '합계', value: 5000 });
```

### 로그 조회

```typescript
import { ocrLogger } from '@/services/ocr';

// 최근 로그 10개
const recentLogs = ocrLogger.getRecentLogs(10);

// 에러 로그만 조회
const errorLogs = ocrLogger.getErrorLogs();

// JSON으로 내보내기
const logsJson = ocrLogger.exportLogs();
console.log(JSON.parse(logsJson));
```

### 로그 예시

```
[OCR INFO] OCR 텍스트 추출 시작 | {"imageUri":"file:///..."}
[OCR DEBUG] 금액 추출 성공 | {"amount":5000,"pattern":"합계"}
[OCR DEBUG] 날짜 추출 성공 | {"date":"2024-02-15","pattern":"YYYY-MM-DD"}
[OCR WARN] 상점명 추출 실패 | {"lines":["첫줄","둘째줄"]}
[OCR INFO] OCR 처리 완료 | {"confidence":0.67,"duration":1234}
```

## 디버깅

### 디버그 정보 출력

```typescript
import { printOcrDebugInfo, getOcrStatistics } from '@/services/ocr';

// 콘솔에 전체 디버그 정보 출력
printOcrDebugInfo();

// 통계 정보만 가져오기
const stats = getOcrStatistics();
console.log('성공률:', `${stats.successRate * 100}%`);
console.log('총 처리:', stats.total);
console.log('성공:', stats.success);
console.log('실패:', stats.failed);
console.log('에러 분포:', stats.errorDistribution);
```

### 로그 파일로 내보내기

```typescript
import { exportOcrLogs } from '@/services/ocr';

// 로그를 파일로 저장
const filePath = await exportOcrLogs();
console.log('로그 저장 위치:', filePath);
// 예: /data/user/0/com.app/files/ocr-logs-2024-02-15T10-30-45.json
```

### 로그 초기화

```typescript
import { clearOcrLogs } from '@/services/ocr';

// 테스트 후 로그 정리
clearOcrLogs();
```

### 디버그 출력 예시

```
=== OCR Debug Info ===
Recent logs: 45
Error logs: 3
Success rate: 93.33%

Error Distribution:
- NO_TEXT_DETECTED: 2
- PARSING_ERROR: 1

Recent Errors:
1. [2024-02-15 10:30:45] NO_TEXT_DETECTED
   Message: 이미지에서 텍스트를 찾을 수 없습니다
   Context: {"imageUri":"file:///..."}

2. [2024-02-15 10:25:30] PARSING_ERROR
   Message: 금액을 찾을 수 없습니다
   Context: {"text":"영수증 내용..."}
```

## 정규식 패턴

### 금액 추출 (우선순위 순)

OCR 파서는 다음 순서로 금액을 추출합니다:

```typescript
// 1. 합계/총액/결제금액 (가장 신뢰도 높음)
/합계[:\s]*([0-9,]+)/i
/총액[:\s]*([0-9,]+)/i
/결제금액[:\s]*([0-9,]+)/i

// 2. 카드/현금
/카드[:\s]*([0-9,]+)/i
/현금[:\s]*([0-9,]+)/i

// 3. 영문 패턴
/TOTAL[:\s]*([0-9,]+)/i
/AMOUNT[:\s]*([0-9,]+)/i

// 4. 통화 기호
/₩\s*([0-9,]+)/
/\\\s*([0-9,]+)/

// 5. 원 단위 (가장 낮은 우선순위)
/([0-9,]+)\s*원/
```

**예시**:
- `합계: 5,000` → 5000 (높은 신뢰도)
- `카드: 15,000` → 15000
- `TOTAL: 8,000` → 8000
- `₩ 6,000` → 6000
- `10000원` → 10000 (낮은 신뢰도)

### 날짜 추출

```typescript
// 1. YYYY-MM-DD 형식
/(\d{4})-(\d{2})-(\d{2})/
/(\d{4})\.(\d{2})\.(\d{2})/
/(\d{4})\/(\d{2})\/(\d{2})/

// 2. 한글 포함
/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/

// 3. YY-MM-DD 형식
/(\d{2})-(\d{2})-(\d{2})/
/(\d{2})\.(\d{2})\.(\d{2})/

// 4. 시간 포함 (날짜 부분만 추출)
/(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}/
```

**예시**:
- `2024-01-15` → 2024-01-15
- `2024년 1월 15일` → 2024-01-15
- `24-01-15` → 2024-01-15 (현재 세기 가정)
- `2024-01-15 14:30` → 2024-01-15

### 상점명 추출

상점명은 3가지 방법으로 시도합니다:

```typescript
// 1. 첫 줄 추출 (가장 일반적)
const firstLine = lines[0]?.trim();

// 2. 키워드로 검색
const storePattern = /(?:상호|사업자)[:\s]*(.+)/i;

// 3. 두 번째 줄 (첫 줄이 로고인 경우)
const secondLine = lines[1]?.trim();
```

### 패턴 추가 방법

새로운 영수증 포맷을 지원하려면 `/services/ocr/parser.ts`에 패턴 추가:

```typescript
// extractAmount() 함수에 추가
const amountPatterns = [
  // ... 기존 패턴
  { pattern: /신규패턴[:\s]*([0-9,]+)/i, name: '신규' },
];

// extractDate() 함수에 추가
const datePatterns = [
  // ... 기존 패턴
  { pattern: /(\d{4})년(\d{2})월/, name: '신규날짜' },
];
```

## 성능 모니터링

### 신뢰도 점수

OCR 결과의 `confidence` 필드는 0-1 사이 값입니다:

```typescript
const result = await extractReceiptData(imageUri);

if (result.confidence >= 0.7) {
  // 높은 신뢰도: 모든 필드 추출 성공
  console.log('✅ OCR 성공');
} else if (result.confidence >= 0.4) {
  // 중간 신뢰도: 일부 필드 추출
  console.log('⚠️ 일부 정보 추출');
  console.log('경고:', result.warnings);
} else {
  // 낮은 신뢰도: 수동 입력 필요
  console.log('❌ 수동 입력 필요');
}
```

### 신뢰도 UI 표시

```typescript
function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 0.7) return 'bg-green-50 text-green-700';
    if (confidence >= 0.4) return 'bg-yellow-50 text-yellow-700';
    return 'bg-orange-50 text-orange-700';
  };

  const getMessage = () => {
    if (confidence >= 0.7) return 'OCR 성공';
    if (confidence >= 0.4) return '일부 정보 추출';
    return '수동 입력 필요';
  };

  return (
    <View className={`p-3 rounded ${getColor()}`}>
      <Text>{getMessage()}</Text>
      <Text className="text-sm">신뢰도: {Math.round(confidence * 100)}%</Text>
    </View>
  );
}
```

### 경고 메시지

```typescript
const result = await extractReceiptData(imageUri);

if (result.warnings && result.warnings.length > 0) {
  // 경고 표시
  result.warnings.forEach(warning => {
    console.warn(warning);
    // 예: "금액을 찾을 수 없습니다"
    // 예: "날짜를 찾을 수 없습니다"
  });

  // UI에 표시
  Alert.alert(
    '일부 정보 추출 실패',
    result.warnings.join('\n') + '\n\n수동으로 입력해주세요.'
  );
}
```

## 문제 해결

### 자주 발생하는 문제

| 문제 | 원인 | 해결 방법 |
|-----|------|---------|
| "텍스트를 찾을 수 없습니다" | 이미지가 흐리거나 어두움 | 조명이 밝은 곳에서 재촬영 |
| "금액을 찾을 수 없습니다" | 비표준 포맷 (예: "5천원") | parser.ts에 패턴 추가 |
| "이미지를 읽을 수 없습니다" | 잘못된 파일 경로 | URI 형식 확인 |
| 낮은 신뢰도 | 일부 필드만 추출됨 | 누락된 필드 수동 입력 |
| OCR이 느림 | 이미지 크기가 큼 | 이미지 리사이징 고려 |

### 성능 최적화

```typescript
// 이미지 크기 확인
import * as ImageManipulator from 'expo-image-manipulator';

// OCR 전 이미지 리사이징
const resized = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 1024 } }], // 최대 1024px
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);

const result = await extractReceiptData(resized.uri);
```

## 테스트

### 테스트 케이스

1. **정상 영수증**
   - 선명한 이미지, 모든 필드 포함
   - 예상: confidence ≥ 0.7

2. **흐린 영수증**
   - 초점이 맞지 않음
   - 예상: `POOR_IMAGE_QUALITY` 또는 낮은 confidence

3. **어두운 영수증**
   - 조명 부족
   - 예상: `NO_TEXT_DETECTED`

4. **부분 영수증**
   - 일부만 촬영됨
   - 예상: 일부 필드만 추출, warnings 존재

5. **비표준 포맷**
   - 특이한 영수증 레이아웃
   - 예상: `PARSING_ERROR` 또는 낮은 confidence

6. **잘못된 이미지**
   - 영수증이 아닌 이미지
   - 예상: `NO_TEXT_DETECTED` 또는 `PARSING_ERROR`

### 테스트 후 확인

```typescript
import { ocrLogger, getOcrStatistics } from '@/services/ocr';

// 에러 로그 확인
const errors = ocrLogger.getErrorLogs();
console.log(`총 에러: ${errors.length}`);

// 통계 확인
const stats = getOcrStatistics();
console.log(`성공률: ${stats.successRate * 100}%`);
console.log(`에러 분포:`, stats.errorDistribution);
```

## Import Paths

```typescript
// 메인 OCR 함수
import { extractReceiptData } from '@/services/ocr';

// 에러 타입
import { OcrErrorType } from '@/services/ocr';
import type { OcrError } from '@/services/ocr';

// 로거
import { ocrLogger } from '@/services/ocr';

// 디버그 도구
import {
  printOcrDebugInfo,
  getOcrStatistics,
  getOcrDebugInfo,
  exportOcrLogs,
  clearOcrLogs
} from '@/services/ocr';
```

## 파일 구조

```
services/ocr/
├── index.ts           # 메인 API (extractReceiptData)
├── types.ts           # 타입 정의, OcrError 클래스
├── parser.ts          # 영수증 텍스트 파싱 로직
├── logger.ts          # 로깅 시스템
├── errorHandler.ts    # 에러 처리 유틸리티
├── debug.ts           # 디버깅 도구
└── README.md          # 상세 문서 (레거시, 이 파일로 대체됨)
```

## 참고

- 구현 요약: `/docs/archived/ocr-error-handling-summary.md`
- 빠른 참조: `/docs/archived/ocr-quick-reference.md`
