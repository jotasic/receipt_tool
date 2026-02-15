# OCR Error Handling - Quick Reference

**통합 문서**: 이 내용은 `/docs/guides/ocr.md`로 통합되었습니다.

이 파일은 역사적 참조용으로 보관됩니다.

---

## 빠른 참조

상세 내용은 `/docs/guides/ocr.md` 참조

### Basic Usage

```typescript
import { extractReceiptData, OcrErrorType, ocrLogger } from '@/services/ocr';

try {
  const receipt = await extractReceiptData(imageUri);
  console.log('Amount:', receipt.amount);
  console.log('Confidence:', receipt.confidence);
} catch (error) {
  const ocrError = error as OcrError;
  alert(ocrError.userMessage);
}
```

### Error Handling

```typescript
switch (ocrError.type) {
  case OcrErrorType.NO_TEXT_DETECTED:
    // 다시 촬영
    break;
  case OcrErrorType.PARSING_ERROR:
    // 수동 입력
    break;
  default:
    if (ocrError.retryable) {
      // 재시도 옵션
    }
}
```

### Logging

```typescript
import { ocrLogger } from '@/services/ocr';

ocrLogger.info('Process started', { imageUri });
ocrLogger.error('Failed', error);

const recent = ocrLogger.getRecentLogs(10);
const errors = ocrLogger.getErrorLogs();
```

### Debug

```typescript
import { printOcrDebugInfo, getOcrStatistics, exportOcrLogs } from '@/services/ocr';

printOcrDebugInfo();
const stats = getOcrStatistics();
const filePath = await exportOcrLogs();
```

## 참고
전체 문서: `/docs/guides/ocr.md`
