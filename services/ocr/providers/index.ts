/**
 * OCR Providers
 *
 * 사용 가능한 OCR 프로바이더:
 * 1. ML Kit (네이티브) - Expo Development Build 필요
 * 2. Google Vision API - API 키 필요, 온라인 필요
 * 3. Mock - 개발/테스트용
 */

import { isGoogleVisionAvailable } from './googleVision';

export * from './mock';
export * from './googleVision';

export type OcrProvider = 'mlkit' | 'googleVision' | 'mock';

/**
 * 현재 사용 가능한 OCR 프로바이더 확인
 */
export function getAvailableProvider(): OcrProvider {
  // ML Kit는 네이티브 모듈이므로 Expo Go에서 사용 불가
  // 런타임에서 확인하기 어려우므로, Google Vision이 설정되어 있으면 사용
  // 그렇지 않으면 Mock 사용

  if (isGoogleVisionAvailable()) {
    return 'googleVision';
  }

  // Expo Go에서는 기본적으로 Mock 사용
  return 'mock';
}
