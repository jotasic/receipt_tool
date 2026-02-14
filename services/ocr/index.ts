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
import {
  getAvailableProvider,
  mockExtractText,
  mockExtractTextDetailed,
  googleVisionExtractText,
  googleVisionExtractTextDetailed,
  type OcrProvider,
} from './providers';

/**
 * OCR 서비스
 *
 * 프로바이더 우선순위:
 * 1. ML Kit (Development Build에서만 작동)
 * 2. Google Vision API (API 키 설정 시)
 * 3. Mock (개발/테스트용)
 *
 * Expo Go에서는 ML Kit가 작동하지 않으므로
 * Google Vision API 또는 Mock 모드로 자동 전환됩니다.
 */

// 타입 및 유틸리티 export
export type { OcrResult, OcrBlock, OcrLine, OcrElement, OcrError } from './types';
export type { ParsedReceipt } from './parser';
export { OcrErrorType } from './types';
export { ocrLogger } from './logger';
export * from './debug';

// 현재 사용 중인 프로바이더
let currentProvider: OcrProvider | null = null;

/**
 * 현재 사용 중인 OCR 프로바이더 반환
 */
export function getCurrentProvider(): OcrProvider {
  if (!currentProvider) {
    currentProvider = getAvailableProvider();
    ocrLogger.info('OCR 프로바이더 선택됨', { provider: currentProvider });
  }
  return currentProvider;
}

/**
 * ML Kit 사용 가능 여부 확인 (Development Build 전용)
 */
async function tryMlKit(imageUri: string): Promise<string | null> {
  try {
    // 동적 import로 ML Kit 사용 시도
    const TextRecognitionModule = await import('@react-native-ml-kit/text-recognition');
    const TextRecognition = TextRecognitionModule.default;
    const { TextRecognitionScript } = TextRecognitionModule;

    // 한글 인식을 위해 KOREAN 스크립트 사용
    const result = await TextRecognition.recognize(imageUri, TextRecognitionScript.KOREAN);
    currentProvider = 'mlkit';
    return result.text;
  } catch (error) {
    // ML Kit 사용 불가 (Expo Go 등)
    ocrLogger.debug('ML Kit 사용 불가, 폴백 프로바이더 사용', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

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

    const startTime = Date.now();
    let text: string;

    // 1. 먼저 ML Kit 시도 (Development Build에서만 작동)
    const mlKitResult = await tryMlKit(imageUri);
    if (mlKitResult !== null) {
      text = mlKitResult;
    } else {
      // 2. 폴백 프로바이더 사용
      const provider = getCurrentProvider();

      if (provider === 'googleVision') {
        text = await googleVisionExtractText(imageUri);
      } else {
        // Mock 프로바이더
        text = await mockExtractText(imageUri);
        ocrLogger.warn('Mock OCR 사용 중 - 실제 이미지 분석이 아닙니다', { imageUri });
      }
    }

    const duration = Date.now() - startTime;

    ocrLogger.info('OCR 텍스트 추출 완료', {
      imageUri,
      textLength: text.length,
      duration: `${duration}ms`,
      provider: currentProvider,
    });

    // 결과 검증 (Mock 모드에서는 검증 스킵)
    if (currentProvider !== 'mock') {
      validateOcrResult(text, imageUri);
    }

    return text;
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
    let ocrResult: OcrResult;

    // ML Kit 먼저 시도
    try {
      const TextRecognitionModule = await import('@react-native-ml-kit/text-recognition');
      const TextRecognition = TextRecognitionModule.default;
      const { TextRecognitionScript } = TextRecognitionModule;

      // 한글 인식을 위해 KOREAN 스크립트 사용
      const result = await TextRecognition.recognize(imageUri, TextRecognitionScript.KOREAN);
      currentProvider = 'mlkit';

      ocrResult = {
        text: result.text,
        blocks: result.blocks.map(block => ({
          text: block.text,
          frame: block.frame,
          lines: block.lines.map(line => ({
            text: line.text,
            frame: line.frame,
            elements: line.elements.map(element => ({
              text: element.text,
              frame: element.frame,
            })),
          })),
        })),
      };
    } catch {
      // 폴백 프로바이더 사용
      const provider = getCurrentProvider();

      if (provider === 'googleVision') {
        ocrResult = await googleVisionExtractTextDetailed(imageUri);
      } else {
        ocrResult = await mockExtractTextDetailed(imageUri);
        ocrLogger.warn('Mock OCR 사용 중 - 실제 이미지 분석이 아닙니다', { imageUri });
      }
    }

    const duration = Date.now() - startTime;

    ocrLogger.info('OCR 상세 추출 완료', {
      imageUri,
      textLength: ocrResult.text.length,
      blockCount: ocrResult.blocks.length,
      lineCount: ocrResult.blocks.reduce((sum, b) => sum + b.lines.length, 0),
      duration: `${duration}ms`,
      provider: currentProvider,
    });

    if (currentProvider !== 'mock') {
      validateOcrResult(ocrResult.text, imageUri);
    }

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

      // Mock 모드에서는 파싱 에러 던지지 않음
      if (currentProvider !== 'mock' && !parsedReceipt.amount && !parsedReceipt.date) {
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
      provider: currentProvider,
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
