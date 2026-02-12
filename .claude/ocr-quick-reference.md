# OCR Error Handling - Quick Reference

## Quick Start

### Basic Usage with Error Handling

```typescript
import { extractReceiptData, OcrErrorType, ocrLogger } from '@/services/ocr';
import type { OcrError } from '@/services/ocr';

try {
  const receipt = await extractReceiptData(imageUri);

  // Check confidence
  if (receipt.confidence && receipt.confidence < 0.7) {
    console.warn('Low confidence:', receipt.warnings);
  }

  // Use data
  console.log('Amount:', receipt.amount);
  console.log('Date:', receipt.date);
  console.log('Store:', receipt.storeName);

} catch (error) {
  const ocrError = error as OcrError;

  // Show user-friendly message
  alert(ocrError.userMessage);

  // Log for debugging
  ocrLogger.error('OCR failed', error as Error);
}
```

## Error Type Quick Reference

```typescript
switch (ocrError.type) {
  case OcrErrorType.IMAGE_ACCESS_ERROR:
    // Image file not accessible
    // Action: Choose different image
    break;

  case OcrErrorType.NO_TEXT_DETECTED:
    // No text found in image
    // Action: Retake photo clearly
    break;

  case OcrErrorType.POOR_IMAGE_QUALITY:
    // Image too blurry/dark
    // Action: Improve lighting, retake
    break;

  case OcrErrorType.PARSING_ERROR:
    // Cannot extract required fields
    // Action: Manual input
    break;

  case OcrErrorType.ML_KIT_INIT_ERROR:
    // ML Kit initialization failed
    // Action: Restart app
    break;

  case OcrErrorType.TIMEOUT_ERROR:
    // Processing timeout
    // Action: Check network, retry
    break;

  case OcrErrorType.UNKNOWN_ERROR:
    // Unclassified error
    // Action: Retry or manual input
    break;
}
```

## Alert Helper

```typescript
function showOcrErrorAlert(error: OcrError) {
  const buttons = [];

  if (error.retryable) {
    buttons.push({ text: '다시 시도', onPress: () => retry() });
  }

  if (error.type === OcrErrorType.NO_TEXT_DETECTED ||
      error.type === OcrErrorType.POOR_IMAGE_QUALITY) {
    buttons.push({ text: '다시 촬영', onPress: () => retake() });
  }

  buttons.push({ text: '수동 입력', style: 'cancel' });

  Alert.alert('OCR 실패', error.userMessage, buttons);
}
```

## Logging Cheat Sheet

```typescript
import { ocrLogger } from '@/services/ocr';

// Log levels
ocrLogger.debug('Debug info', { detail: 'value' });
ocrLogger.info('Process started', { imageUri });
ocrLogger.warn('Partial success', { missing: ['amount'] });
ocrLogger.error('Failed', error, { context: 'OCR' });

// View logs
const recent = ocrLogger.getRecentLogs(10);
const errors = ocrLogger.getErrorLogs();

// Export logs
const json = ocrLogger.exportLogs();
console.log(json);
```

## Debug Commands

```typescript
import {
  printOcrDebugInfo,
  getOcrStatistics,
  exportOcrLogs,
  clearOcrLogs
} from '@/services/ocr';

// Print debug info to console
printOcrDebugInfo();

// Get statistics
const stats = getOcrStatistics();
console.log('Success rate:', stats.successRate * 100, '%');

// Export logs to file
const filePath = await exportOcrLogs();

// Clear logs (testing)
clearOcrLogs();
```

## Regex Pattern Priorities

### Amount (High to Low)
1. `합계: 5000` (highest confidence)
2. `카드: 5000`
3. `TOTAL: 5000`
4. `₩ 5000`
5. `5000원` (lowest confidence)

### Date (High to Low)
1. `2024-01-15`
2. `2024년 1월 15일`
3. `24-01-15`
4. `2024-01-15 14:30` (extracts date part)

### Store Name (Order of Attempts)
1. First line
2. Line with `상호:` keyword
3. Second line

## Confidence Levels

```typescript
if (receipt.confidence >= 0.7) {
  // High confidence - all fields extracted
  console.log('✅ OCR 성공');
} else if (receipt.confidence >= 0.4) {
  // Medium confidence - some fields extracted
  console.log('⚠️ 일부 정보 추출');
} else {
  // Low confidence - manual input needed
  console.log('❌ 수동 입력 필요');
}
```

## Adding New Regex Patterns

### In `/services/ocr/parser.ts`

```typescript
// Add to extractAmount()
const amountPatterns = [
  // ... existing patterns
  { pattern: /신규패턴[:\s]*([0-9,]+)/i, name: '신규' },
];

// Add to extractDate()
const datePatterns = [
  // ... existing patterns
  { pattern: /(\d{4})년(\d{2})월/, name: '신규날짜' },
];
```

## UI Components

### Error Banner
```typescript
{ocrError && (
  <View className="bg-red-50 border border-red-200 p-4">
    <Text className="text-red-700">{ocrError.userMessage}</Text>
    {ocrError.suggestedAction && (
      <Text className="text-red-600 text-sm">
        {ocrError.suggestedAction}
      </Text>
    )}
  </View>
)}
```

### Confidence Indicator
```typescript
{confidence > 0 && (
  <View className={
    confidence >= 0.7 ? 'bg-green-50' :
    confidence >= 0.4 ? 'bg-yellow-50' :
    'bg-orange-50'
  }>
    <Text>{Math.round(confidence * 100)}%</Text>
  </View>
)}
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "텍스트를 찾을 수 없습니다" | Blurry image | Retake in good lighting |
| "금액을 찾을 수 없습니다" | Unusual format | Add regex pattern |
| "이미지를 읽을 수 없습니다" | Invalid file path | Check URI format |
| Low confidence | Partial extraction | Manual input for missing fields |

## File Structure

```
services/ocr/
├── index.ts           # Main API
├── types.ts           # Type definitions
├── parser.ts          # Receipt parsing
├── logger.ts          # Logging system
├── errorHandler.ts    # Error handling
├── debug.ts           # Debug utilities
└── README.md          # Full documentation
```

## Import Paths

```typescript
// Main OCR functions
import { extractReceiptData } from '@/services/ocr';

// Error types
import { OcrErrorType } from '@/services/ocr';
import type { OcrError } from '@/services/ocr';

// Logger
import { ocrLogger } from '@/services/ocr';

// Debug tools
import {
  printOcrDebugInfo,
  getOcrStatistics,
  exportOcrLogs
} from '@/services/ocr';
```

## Testing Checklist

- [ ] Normal receipt (clear image)
- [ ] Blurry receipt
- [ ] Dark/underexposed receipt
- [ ] Partial receipt (cropped)
- [ ] Non-receipt image
- [ ] Invalid file path
- [ ] Various receipt formats (different stores)
- [ ] Check logs after each test
- [ ] Verify error messages are user-friendly
- [ ] Test retry/retake/manual input flows

## Performance Tips

1. **Don't log in production loops** - Use INFO/WARN/ERROR only
2. **Clear logs periodically** - Prevents memory buildup
3. **Export logs for analysis** - Review failure patterns
4. **Monitor success rate** - Track OCR effectiveness

## Resources

- Full Documentation: `/services/ocr/README.md`
- Implementation Summary: `/.claude/ocr-error-handling-summary.md`
- Type Definitions: `/services/ocr/types.ts`
