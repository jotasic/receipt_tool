# OCR Service API

이미지에서 영수증 데이터 추출 API

## Main Function

### extractReceiptData

```typescript
extractReceiptData(imageUri: string): Promise<ParsedReceipt>
```

이미지에서 영수증 데이터 추출

**Parameters:**
- `imageUri`: 이미지 파일 경로 (file:// URI)

**Returns:** ParsedReceipt
- `storeName`: `string | undefined` - 상점명
- `amount`: `number | undefined` - 금액
- `date`: `string | undefined` - 날짜 (ISO format)
- `confidence`: `number` - 신뢰도 (0-1)
- `warnings`: `string[]` - 경고 메시지

**Throws:** OcrError
- `type`: OcrErrorType
- `userMessage`: 사용자용 메시지
- `retryable`: 재시도 가능 여부
- `suggestedAction`: 권장 조치

**Example:**
```typescript
try {
  const result = await extractReceiptData(imageUri);
  console.log('금액:', result.amount);
  console.log('신뢰도:', result.confidence);
} catch (error) {
  const ocrError = error as OcrError;
  console.error(ocrError.userMessage);
}
```

---

## Error Types

### OcrErrorType

```typescript
enum OcrErrorType {
  IMAGE_ACCESS_ERROR = 'IMAGE_ACCESS_ERROR',
  ML_KIT_INIT_ERROR = 'ML_KIT_INIT_ERROR',
  NO_TEXT_DETECTED = 'NO_TEXT_DETECTED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  POOR_IMAGE_QUALITY = 'POOR_IMAGE_QUALITY',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

---

## Logger

### ocrLogger

```typescript
ocrLogger.info(message: string, context?: any): void
ocrLogger.warn(message: string, context?: any): void
ocrLogger.error(message: string, error?: Error, context?: any): void
ocrLogger.debug(message: string, context?: any): void

ocrLogger.getRecentLogs(limit?: number): OcrLogEntry[]
ocrLogger.getErrorLogs(): OcrLogEntry[]
ocrLogger.exportLogs(): string
```

---

## Debug Functions

```typescript
printOcrDebugInfo(): void
getOcrStatistics(): OcrStatistics
getOcrDebugInfo(): OcrDebugInfo
exportOcrLogs(): Promise<string>
clearOcrLogs(): void
```
