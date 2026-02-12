import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { OcrResult } from './types';
import { parseReceiptText, type ParsedReceipt } from './parser';
import { ocrLogger } from './logger';
import {
  handleOcrError,
  validateOcrResult,
  createImageAccessError,
  createParsingError,
} from './errorHandler';
import { OcrErrorType } from './types';

/**
 * OCR 서비스
 * @react-native-ml-kit/text-recognition을 사용하여 이미지에서 텍스트 추출
 *
 * 특징:
 * - 오프라인 동작 (기기 내 ML Kit 모델 사용)
 * - 무료
 * - 한글 및 영어 지원
 * - 상세 에러 처리 및 로깅
 */

// 타입 및 유틸리티 export
export type { OcrResult, OcrBlock, OcrLine, OcrElement, OcrError } from './types';
export type { ParsedReceipt } from './parser';
export { OcrErrorType } from './types';
export { ocrLogger } from './logger';
export * from './debug';

/**
 * 이미지에서 텍스트 추출
 * @param imageUri 로컬 이미지 URI (file://, content://, 또는 절대 경로)
 * @returns 추출된 전체 텍스트
 * @throws OcrError OCR 처리 중 오류 발생 시
 */
export async function extractText(imageUri: string): Promise<string> {
  ocrLogger.info('OCR 텍스트 추출 시작', { imageUri });

  try {
    // 이미지 URI 유효성 검증
    if (!imageUri || imageUri.trim().length === 0) {
      throw createImageAccessError(new Error('Image URI is empty'));
    }

    // ML Kit Text Recognition 실행
    const startTime = Date.now();
    const result = await TextRecognition.recognize(imageUri);
    const duration = Date.now() - startTime;

    ocrLogger.info('OCR 텍스트 추출 완료', {
      imageUri,
      textLength: result.text.length,
      blockCount: result.blocks.length,
      duration: `${duration}ms`,
    });

    // 결과 검증
    validateOcrResult(result.text, imageUri);

    return result.text;
  } catch (error) {
    const ocrError = handleOcrError(error, 'extractText');
    ocrLogger.error('OCR 텍스트 추출 실패', error instanceof Error ? error : undefined, {
      imageUri,
      errorType: ocrError.type,
    });
    throw ocrError;
  }
}

/**
 * 이미지에서 텍스트 추출 (상세 정보 포함)
 * @param imageUri 로컬 이미지 URI
 * @returns 블록/라인/요소 단위로 구조화된 OCR 결과
 * @throws OcrError OCR 처리 중 오류 발생 시
 */
export async function extractTextDetailed(imageUri: string): Promise<OcrResult> {
  ocrLogger.info('OCR 상세 추출 시작', { imageUri });

  try {
    if (!imageUri || imageUri.trim().length === 0) {
      throw createImageAccessError(new Error('Image URI is empty'));
    }

    const startTime = Date.now();
    const result = await TextRecognition.recognize(imageUri);
    const duration = Date.now() - startTime;

    const ocrResult: OcrResult = {
      text: result.text,
      blocks: result.blocks.map(block => ({
        text: block.text,
        lines: block.lines.map(line => ({
          text: line.text,
          elements: line.elements.map(element => ({
            text: element.text,
          })),
        })),
      })),
    };

    ocrLogger.info('OCR 상세 추출 완료', {
      imageUri,
      textLength: ocrResult.text.length,
      blockCount: ocrResult.blocks.length,
      lineCount: ocrResult.blocks.reduce((sum, b) => sum + b.lines.length, 0),
      duration: `${duration}ms`,
    });

    validateOcrResult(ocrResult.text, imageUri);

    return ocrResult;
  } catch (error) {
    const ocrError = handleOcrError(error, 'extractTextDetailed');
    ocrLogger.error('OCR 상세 추출 실패', error instanceof Error ? error : undefined, {
      imageUri,
      errorType: ocrError.type,
    });
    throw ocrError;
  }
}

/**
 * 영수증 특화 텍스트 추출
 * 영수증에서 주요 정보(날짜, 금액, 상점명 등) 추출에 최적화
 *
 * @param imageUri 영수증 이미지 URI
 * @returns 추출된 텍스트
 * @throws OcrError OCR 처리 중 오류 발생 시
 */
export async function extractReceiptText(imageUri: string): Promise<string> {
  ocrLogger.info('영수증 텍스트 추출 시작', { imageUri });

  try {
    // 현재는 기본 extractText와 동일
    // 향후 영수증 전처리 로직 추가 가능:
    // - 이미지 회전 보정
    // - 대비 조정
    // - 노이즈 제거
    const text = await extractText(imageUri);

    ocrLogger.info('영수증 텍스트 추출 완료', {
      imageUri,
      textLength: text.length,
    });

    return text;
  } catch (error) {
    const ocrError = handleOcrError(error, 'extractReceiptText');
    ocrLogger.error('영수증 텍스트 추출 실패', error instanceof Error ? error : undefined, {
      imageUri,
      errorType: ocrError.type,
    });
    throw ocrError;
  }
}

/**
 * 영수증 데이터 추출 (OCR + 파싱)
 * 이미지에서 텍스트 추출 후 영수증 정보 파싱까지 한 번에 수행
 *
 * @param imageUri 영수증 이미지 URI
 * @returns 파싱된 영수증 데이터 (상호명, 날짜, 금액, 원본 텍스트)
 * @throws OcrError OCR 처리 중 오류 발생 시
 *
 * @example
 * ```typescript
 * const receipt = await extractReceiptData('file:///path/to/receipt.jpg');
 * console.log(receipt.storeName); // "스타벅스"
 * console.log(receipt.date);      // "2024-01-15"
 * console.log(receipt.amount);    // 4500
 * ```
 */
export async function extractReceiptData(imageUri: string): Promise<ParsedReceipt> {
  ocrLogger.info('영수증 데이터 추출 시작', { imageUri });

  try {
    // 1. OCR로 텍스트 추출
    const rawText = await extractText(imageUri);

    // 2. 텍스트 파싱
    const parsedReceipt = parseReceiptText(rawText);

    // 3. 파싱 결과 검증 및 로깅
    const missingFields: string[] = [];
    if (!parsedReceipt.amount) missingFields.push('금액');
    if (!parsedReceipt.date) missingFields.push('날짜');
    if (!parsedReceipt.storeName) missingFields.push('상호명');

    if (missingFields.length > 0) {
      ocrLogger.warn('일부 필드 추출 실패', {
        imageUri,
        missingFields,
        confidence: parsedReceipt.confidence,
      });

      // 필수 필드(금액, 날짜) 모두 없으면 파싱 에러
      if (!parsedReceipt.amount && !parsedReceipt.date) {
        throw createParsingError(missingFields);
      }
    }

    ocrLogger.info('영수증 데이터 추출 완료', {
      imageUri,
      hasStoreName: !!parsedReceipt.storeName,
      hasDate: !!parsedReceipt.date,
      hasAmount: !!parsedReceipt.amount,
      confidence: parsedReceipt.confidence,
      warnings: parsedReceipt.warnings?.length || 0,
    });

    return parsedReceipt;
  } catch (error) {
    const ocrError = handleOcrError(error, 'extractReceiptData');
    ocrLogger.error('영수증 데이터 추출 실패', error instanceof Error ? error : undefined, {
      imageUri,
      errorType: ocrError.type,
    });
    throw ocrError;
  }
}
