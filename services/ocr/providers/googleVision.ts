/**
 * Google Cloud Vision OCR Provider
 *
 * 사용하려면:
 * 1. Google Cloud Console에서 Vision API 활성화
 * 2. API 키 생성
 * 3. 환경변수 EXPO_PUBLIC_GOOGLE_VISION_API_KEY 설정
 */

import * as FileSystem from 'expo-file-system';
import type { OcrResult } from '../types';
import { ocrLogger } from '../logger';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly?: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    fullTextAnnotation?: {
      text: string;
      pages: Array<{
        blocks: Array<{
          paragraphs: Array<{
            words: Array<{
              symbols: Array<{
                text: string;
              }>;
            }>;
          }>;
        }>;
      }>;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

/**
 * API 키가 설정되어 있는지 확인
 */
export function isGoogleVisionAvailable(): boolean {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  return !!apiKey && apiKey.length > 0;
}

/**
 * 이미지를 Base64로 변환
 */
async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    return base64;
  } catch (error) {
    ocrLogger.error('이미지 Base64 변환 실패', error instanceof Error ? error : undefined, {
      imageUri,
    });
    throw new Error('이미지를 읽을 수 없습니다');
  }
}

/**
 * Google Vision API를 사용하여 텍스트 추출
 */
export async function googleVisionExtractText(imageUri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    throw new Error('Google Vision API 키가 설정되지 않았습니다. EXPO_PUBLIC_GOOGLE_VISION_API_KEY 환경변수를 설정하세요.');
  }

  ocrLogger.info('Google Vision OCR 시작', { imageUri });

  try {
    // 이미지를 Base64로 변환
    const base64Image = await imageToBase64(imageUri);

    // Vision API 요청
    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
            imageContext: {
              languageHints: ['ko', 'en'],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API 요청 실패: ${response.status}`);
    }

    const data: VisionApiResponse = await response.json();

    // 에러 확인
    if (data.responses[0]?.error) {
      throw new Error(data.responses[0].error.message);
    }

    // 텍스트 추출
    const fullText = data.responses[0]?.fullTextAnnotation?.text ||
                     data.responses[0]?.textAnnotations?.[0]?.description ||
                     '';

    ocrLogger.info('Google Vision OCR 완료', {
      imageUri,
      textLength: fullText.length,
    });

    return fullText;
  } catch (error) {
    ocrLogger.error('Google Vision OCR 실패', error instanceof Error ? error : undefined, {
      imageUri,
    });
    throw error;
  }
}

/**
 * Google Vision API를 사용하여 상세 텍스트 추출
 */
export async function googleVisionExtractTextDetailed(imageUri: string): Promise<OcrResult> {
  const text = await googleVisionExtractText(imageUri);

  // 라인 기반으로 간단한 블록 구조 생성
  const lines = text.split('\n').filter(line => line.trim());

  return {
    text,
    blocks: [{
      text,
      lines: lines.map(line => ({
        text: line,
        elements: line.split(/\s+/).filter(word => word.trim()).map(word => ({
          text: word,
        })),
      })),
    }],
  };
}
