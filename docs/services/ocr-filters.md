# OCR 필터 서비스

OCR 텍스트 박스 필터링 로직을 분리한 서비스입니다.

## 개요

- **경로**: `/services/ocr/filters.ts`
- **목적**: OCR 인식 결과 중 불필요한 박스 제거
- **적용**: OCR 텍스트 추출 시 텍스트 정제

## 필터링 대상

OCR에서 인식한 모든 텍스트 박스 중 다음을 제거합니다:

1. **세로 텍스트**: 회전된 텍스트, 로고 등
2. **너무 작은 박스**: 노이즈, 인쇄 결함
3. **단일 문자**: 구분 기호, 점 등

## 필터 상수

조정 가능한 임계값들:

```typescript
export const VERTICAL_TEXT_RATIO = 2.0;     // 세로 텍스트 판정: height/width > 2.0
export const MIN_BOX_WIDTH = 20;            // 최소 너비: 20px
export const MIN_BOX_HEIGHT = 10;           // 최소 높이: 10px
export const MIN_TEXT_LENGTH = 2;           // 최소 문자: 2자 이상
```

## 필터 함수

### isNotVerticalText

```typescript
export function isNotVerticalText(line: OcrLine): boolean
```

세로 텍스트 필터 (세로 텍스트를 제거)

**판정 기준:**
```
ratio = height / width
ratio > 2.0 → 세로 텍스트 (제거)
ratio ≤ 2.0 → 일반 텍스트 (유지)
```

**예시:**
- 세로 텍스트 (높이 100, 너비 30) → ratio = 3.33 → 제거
- 일반 텍스트 (높이 20, 너비 100) → ratio = 0.2 → 유지

### isNotTooSmall

```typescript
export function isNotTooSmall(line: OcrLine): boolean
```

최소 크기 필터 (너무 작은 박스 제거)

**판정 기준:**
```
width >= 20px && height >= 10px → 유지
otherwise → 제거
```

**예시:**
- (width: 50, height: 15) → 유지
- (width: 15, height: 20) → 제거 (너비 부족)
- (width: 50, height: 8) → 제거 (높이 부족)

### isNotSingleChar

```typescript
export function isNotSingleChar(line: OcrLine): boolean
```

단일 문자 필터 (1자 텍스트 제거)

**판정 기준:**
```
text.trim().length >= 2 → 유지 (2자 이상)
text.trim().length < 2 → 제거 (1자 또는 공백)
```

**예시:**
- "가" → 제거
- "식사" → 유지
- "  " → 제거 (공백만)

## 통합 필터

### shouldShowOcrLine

```typescript
export function shouldShowOcrLine(line: OcrLine): boolean
```

모든 필터를 적용하여 최종 판정합니다.

**로직:**
```typescript
const ACTIVE_FILTERS = [
  isNotVerticalText,
  isNotTooSmall,
  isNotSingleChar,
];

// 모든 필터를 통과해야 유지됨
return ACTIVE_FILTERS.every(filter => filter(line));
```

**사용 예:**
```typescript
import { shouldShowOcrLine } from '@/services/ocr/filters';

const filteredLines = ocrLines.filter(line => shouldShowOcrLine(line));
```

## 사용 패턴

### 1. OCR 추출 시 필터 적용

```typescript
import { extractOcrBoxes } from '@/services/ocr';
import { shouldShowOcrLine } from '@/services/ocr/filters';

async function getCleanOcrText(imageUri: string) {
  const allLines = await extractOcrBoxes(imageUri);
  const cleanLines = allLines.filter(line => shouldShowOcrLine(line));
  return cleanLines;
}
```

### 2. OCR 미리보기에서 박스 표시

```typescript
import { shouldShowOcrLine } from '@/services/ocr/filters';

function OcrPreview({ ocrLines }: { ocrLines: OcrLine[] }) {
  const visibleLines = ocrLines.filter(line => shouldShowOcrLine(line));

  return (
    <View>
      {visibleLines.map((line) => (
        <View
          key={line.id}
          style={{
            position: 'absolute',
            left: line.frame.x,
            top: line.frame.y,
            width: line.frame.width,
            height: line.frame.height,
            borderWidth: 1,
            borderColor: '#3B82F6',
          }}
        >
          <Text>{line.text}</Text>
        </View>
      ))}
    </View>
  );
}
```

## 필터 커스터마이징

### 필터 추가

새로운 필터를 추가하려면:

```typescript
// 1. 필터 함수 작성
export function isRelevantContent(line: OcrLine): boolean {
  // 새로운 조건
  return line.confidence > 0.7;  // 신뢰도 70% 이상만 유지
}

// 2. ACTIVE_FILTERS 배열에 추가
const ACTIVE_FILTERS: Array<(line: OcrLine) => boolean> = [
  isNotVerticalText,
  isNotTooSmall,
  isNotSingleChar,
  isRelevantContent,  // 추가된 필터
];
```

### 필터 상수 조정

필터링 동작을 미세 조정하려면:

```typescript
// 더 엄격한 필터링: 세로 텍스트 판정 기준 완화
export const VERTICAL_TEXT_RATIO = 1.5;  // 기본: 2.0

// 더 느슨한 필터링: 최소 박스 크기 축소
export const MIN_BOX_WIDTH = 15;         // 기본: 20
export const MIN_BOX_HEIGHT = 8;         // 기본: 10

// 더 많은 텍스트 유지: 최소 문자 수 축소
export const MIN_TEXT_LENGTH = 1;        // 기본: 2 (1자 허용)
```

### 필터 비활성화

특정 필터를 임시 비활성화:

```typescript
// 세로 텍스트 필터만 제거
const ACTIVE_FILTERS: Array<(line: OcrLine) => boolean> = [
  // isNotVerticalText,  // 주석 처리
  isNotTooSmall,
  isNotSingleChar,
];
```

## 데이터 타입

### OcrLine

```typescript
interface OcrLine {
  text: string;                    // 인식된 텍스트
  frame?: {
    x: number;                     // 왼쪽 위 X 좌표
    y: number;                     // 왼쪽 위 Y 좌표
    width: number;                 // 박스 너비 (픽셀)
    height: number;                // 박스 높이 (픽셀)
  };
  confidence?: number;             // 신뢰도 (0-1)
  id?: string;                     // 고유 ID
}
```

## 성능

- **시간 복잡도**: O(n) - 각 박스를 1회 검사
- **공간 복잡도**: O(n) - 필터된 결과 저장

대부분의 OCR 결과는 수십~수백 개 박스이므로 성능 문제 없음.

## 테스트 예

```typescript
import { shouldShowOcrLine, isNotVerticalText } from '@/services/ocr/filters';

describe('OCR Filters', () => {
  test('필터: 세로 텍스트 제거', () => {
    const verticalLine = {
      text: '세로',
      frame: { x: 0, y: 0, width: 20, height: 50 },
    };
    expect(isNotVerticalText(verticalLine)).toBe(false);  // 제거됨
  });

  test('필터: 너무 작은 박스 제거', () => {
    const tinyLine = {
      text: '점',
      frame: { x: 0, y: 0, width: 10, height: 5 },  // 너무 작음
    };
    expect(shouldShowOcrLine(tinyLine)).toBe(false);
  });

  test('필터: 단일 문자 제거', () => {
    const singleChar = {
      text: '!',
      frame: { x: 0, y: 0, width: 30, height: 30 },
    };
    expect(shouldShowOcrLine(singleChar)).toBe(false);
  });

  test('필터 통과: 일반 텍스트', () => {
    const normalLine = {
      text: '식사료',
      frame: { x: 0, y: 0, width: 100, height: 25 },
    };
    expect(shouldShowOcrLine(normalLine)).toBe(true);  // 유지됨
  });
});
```

## 참고

- [OCR Service](/docs/services/ocr-service.md) - OCR 추출 서비스
- OCR 좌표 시스템: 피크셀 기준 (장비 독립적)
