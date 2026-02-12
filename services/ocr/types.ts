/**
 * OCR 서비스 타입 정의
 */

/**
 * OCR 텍스트 요소 (단어/문자)
 */
export interface OcrElement {
  text: string;
}

/**
 * OCR 텍스트 라인
 */
export interface OcrLine {
  text: string;
  elements: OcrElement[];
}

/**
 * OCR 텍스트 블록
 */
export interface OcrBlock {
  text: string;
  lines: OcrLine[];
}

/**
 * OCR 전체 결과
 */
export interface OcrResult {
  /** 추출된 전체 텍스트 */
  text: string;
  /** 블록 단위로 구조화된 텍스트 */
  blocks: OcrBlock[];
}

/**
 * OCR 에러
 */
export class OcrError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'OcrError';
  }
}
