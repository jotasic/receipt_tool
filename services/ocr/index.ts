import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { OcrResult } from './types';
import { parseReceiptText, type ParsedReceipt } from './parser';

/**
 * OCR 서비스
 * @react-native-ml-kit/text-recognition을 사용하여 이미지에서 텍스트 추출
 *
 * 특징:
 * - 오프라인 동작 (기기 내 ML Kit 모델 사용)
 * - 무료
 * - 한글 및 영어 지원
 */

// 타입은 types.ts 및 parser.ts에서 export
export type { OcrResult, OcrBlock, OcrLine, OcrElement, OcrError } from './types';
export type { ParsedReceipt } from './parser';

/**
 * 이미지에서 텍스트 추출
 * @param imageUri 로컬 이미지 URI (file://, content://, 또는 절대 경로)
 * @returns 추출된 전체 텍스트
 * @throws OCR 처리 중 오류 발생 시
 */
export async function extractText(imageUri: string): Promise<string> {
  try {
    // ML Kit Text Recognition 실행
    const result = await TextRecognition.recognize(imageUri);

    // 전체 텍스트 반환
    return result.text;
  } catch (error) {
    console.error('OCR extractText error:', error);
    throw new Error(`OCR 텍스트 추출 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 이미지에서 텍스트 추출 (상세 정보 포함)
 * @param imageUri 로컬 이미지 URI
 * @returns 블록/라인/요소 단위로 구조화된 OCR 결과
 */
export async function extractTextDetailed(imageUri: string): Promise<OcrResult> {
  try {
    const result = await TextRecognition.recognize(imageUri);

    return {
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
  } catch (error) {
    console.error('OCR extractTextDetailed error:', error);
    throw new Error(`OCR 상세 추출 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 영수증 특화 텍스트 추출
 * 영수증에서 주요 정보(날짜, 금액, 상점명 등) 추출에 최적화
 *
 * @param imageUri 영수증 이미지 URI
 * @returns 추출된 텍스트
 */
export async function extractReceiptText(imageUri: string): Promise<string> {
  // 현재는 기본 extractText와 동일
  // 향후 영수증 전처리 로직 추가 가능:
  // - 이미지 회전 보정
  // - 대비 조정
  // - 노이즈 제거
  return extractText(imageUri);
}

/**
 * 영수증 데이터 추출 (OCR + 파싱)
 * 이미지에서 텍스트 추출 후 영수증 정보 파싱까지 한 번에 수행
 *
 * @param imageUri 영수증 이미지 URI
 * @returns 파싱된 영수증 데이터 (상호명, 날짜, 금액, 원본 텍스트)
 * @throws OCR 처리 중 오류 발생 시
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
  const rawText = await extractText(imageUri);
  return parseReceiptText(rawText);
}
