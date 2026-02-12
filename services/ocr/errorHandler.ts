/**
 * OCR 에러 처리 유틸리티
 * 다양한 에러 상황을 감지하고 적절한 OcrError로 변환
 */

import { OcrError, OcrErrorType, type OcrErrorDetails } from './types';
import { ocrLogger } from './logger';

/**
 * 원본 에러를 분석하여 OCR 에러로 변환
 */
export function handleOcrError(error: unknown, context?: string): OcrError {
  ocrLogger.error('OCR 에러 발생', error instanceof Error ? error : undefined, {
    context,
    errorType: typeof error,
  });

  // 이미 OcrError인 경우 그대로 반환
  if (error instanceof OcrError) {
    return error;
  }

  // Error 객체인 경우 메시지 분석
  if (error instanceof Error) {
    return classifyErrorByMessage(error, context);
  }

  // 그 외의 경우 알 수 없는 에러로 처리
  return createUnknownError(error, context);
}

/**
 * 에러 메시지를 분석하여 에러 타입 분류
 */
function classifyErrorByMessage(error: Error, context?: string): OcrError {
  const message = error.message.toLowerCase();

  // 이미지 접근 에러
  if (
    message.includes('file') ||
    message.includes('no such') ||
    message.includes('permission') ||
    message.includes('access denied') ||
    message.includes('enoent')
  ) {
    return createImageAccessError(error);
  }

  // 타임아웃 에러
  if (message.includes('timeout') || message.includes('timed out')) {
    return createTimeoutError(error);
  }

  // ML Kit 초기화 에러
  if (
    message.includes('ml kit') ||
    message.includes('initialization') ||
    message.includes('not initialized')
  ) {
    return createMlKitInitError(error);
  }

  // 텍스트 미감지 에러
  if (
    message.includes('no text') ||
    message.includes('empty') ||
    message.includes('not found')
  ) {
    return createNoTextDetectedError(error);
  }

  // 기본: 알 수 없는 에러
  return createUnknownError(error, context);
}

/**
 * 이미지 접근 에러 생성
 */
export function createImageAccessError(originalError?: unknown): OcrError {
  const details: OcrErrorDetails = {
    type: OcrErrorType.IMAGE_ACCESS_ERROR,
    userMessage: '이미지를 읽을 수 없습니다',
    technicalMessage: 'Failed to access or read image file',
    recoverable: true,
    retryable: true,
    suggestedAction: '다른 이미지를 선택하거나 카메라로 다시 촬영해주세요',
    originalError,
  };

  return new OcrError(details);
}

/**
 * ML Kit 초기화 에러 생성
 */
export function createMlKitInitError(originalError?: unknown): OcrError {
  const details: OcrErrorDetails = {
    type: OcrErrorType.ML_KIT_INIT_ERROR,
    userMessage: 'OCR 서비스를 시작할 수 없습니다',
    technicalMessage: 'ML Kit initialization failed',
    recoverable: false,
    retryable: true,
    suggestedAction: '앱을 재시작하거나 잠시 후 다시 시도해주세요',
    originalError,
  };

  return new OcrError(details);
}

/**
 * 텍스트 미감지 에러 생성
 */
export function createNoTextDetectedError(originalError?: unknown): OcrError {
  const details: OcrErrorDetails = {
    type: OcrErrorType.NO_TEXT_DETECTED,
    userMessage: '영수증에서 텍스트를 찾을 수 없습니다',
    technicalMessage: 'No text detected in image',
    recoverable: true,
    retryable: true,
    suggestedAction: '영수증이 선명하게 보이도록 다시 촬영해주세요',
    originalError,
  };

  return new OcrError(details);
}

/**
 * 타임아웃 에러 생성
 */
export function createTimeoutError(originalError?: unknown): OcrError {
  const details: OcrErrorDetails = {
    type: OcrErrorType.TIMEOUT_ERROR,
    userMessage: 'OCR 처리 시간이 초과되었습니다',
    technicalMessage: 'OCR processing timeout',
    recoverable: true,
    retryable: true,
    suggestedAction: '네트워크 상태를 확인하고 다시 시도해주세요',
    originalError,
  };

  return new OcrError(details);
}

/**
 * 이미지 품질 에러 생성
 */
export function createPoorImageQualityError(reason: string, originalError?: unknown): OcrError {
  const details: OcrErrorDetails = {
    type: OcrErrorType.POOR_IMAGE_QUALITY,
    userMessage: `이미지 품질이 좋지 않습니다: ${reason}`,
    technicalMessage: `Poor image quality: ${reason}`,
    recoverable: true,
    retryable: true,
    suggestedAction: '조명이 밝은 곳에서 영수증이 선명하게 보이도록 다시 촬영해주세요',
    originalError,
  };

  return new OcrError(details);
}

/**
 * 파싱 에러 생성
 */
export function createParsingError(missingFields: string[], originalError?: unknown): OcrError {
  const details: OcrErrorDetails = {
    type: OcrErrorType.PARSING_ERROR,
    userMessage: '영수증 정보를 추출할 수 없습니다',
    technicalMessage: `Failed to parse required fields: ${missingFields.join(', ')}`,
    recoverable: true,
    retryable: false,
    suggestedAction: '수동으로 정보를 입력해주세요',
    originalError,
  };

  return new OcrError(details);
}

/**
 * 알 수 없는 에러 생성
 */
export function createUnknownError(originalError?: unknown, context?: string): OcrError {
  const details: OcrErrorDetails = {
    type: OcrErrorType.UNKNOWN_ERROR,
    userMessage: '알 수 없는 오류가 발생했습니다',
    technicalMessage: context
      ? `Unknown error in ${context}: ${String(originalError)}`
      : `Unknown error: ${String(originalError)}`,
    recoverable: true,
    retryable: true,
    suggestedAction: '다시 시도하거나 수동으로 입력해주세요',
    originalError,
  };

  return new OcrError(details);
}

/**
 * OCR 결과 검증 및 에러 생성
 */
export function validateOcrResult(text: string, imageUri: string): void {
  ocrLogger.debug('OCR 결과 검증', {
    textLength: text.length,
    imageUri,
  });

  // 텍스트가 비어있는 경우
  if (!text || text.trim().length === 0) {
    ocrLogger.warn('텍스트 미감지', { imageUri });
    throw createNoTextDetectedError();
  }

  // 텍스트가 너무 짧은 경우 (영수증이 아닐 가능성)
  if (text.trim().length < 10) {
    ocrLogger.warn('텍스트 너무 짧음', {
      textLength: text.length,
      imageUri,
    });
    throw createPoorImageQualityError('인식된 텍스트가 너무 짧습니다');
  }
}
