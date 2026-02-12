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
 * OCR 에러 타입
 */
export enum OcrErrorType {
  /** 이미지 파일 접근/읽기 실패 */
  IMAGE_ACCESS_ERROR = 'IMAGE_ACCESS_ERROR',
  /** ML Kit 초기화 실패 */
  ML_KIT_INIT_ERROR = 'ML_KIT_INIT_ERROR',
  /** OCR 인식 실패 (텍스트 없음) */
  NO_TEXT_DETECTED = 'NO_TEXT_DETECTED',
  /** OCR 처리 타임아웃 */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** 이미지 품질 문제 (너무 흐림, 어두움 등) */
  POOR_IMAGE_QUALITY = 'POOR_IMAGE_QUALITY',
  /** 파싱 실패 (필수 정보 추출 불가) */
  PARSING_ERROR = 'PARSING_ERROR',
  /** 알 수 없는 에러 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * OCR 에러 상세 정보
 */
export interface OcrErrorDetails {
  /** 에러 타입 */
  type: OcrErrorType;
  /** 사용자에게 표시할 메시지 */
  userMessage: string;
  /** 개발자용 상세 메시지 */
  technicalMessage: string;
  /** 복구 가능 여부 */
  recoverable: boolean;
  /** 재시도 권장 여부 */
  retryable: boolean;
  /** 사용자 액션 가이드 */
  suggestedAction?: string;
  /** 원본 에러 */
  originalError?: unknown;
}

/**
 * OCR 에러
 */
export class OcrError extends Error {
  public readonly type: OcrErrorType;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly suggestedAction?: string;
  public readonly originalError?: unknown;

  constructor(details: OcrErrorDetails) {
    super(details.technicalMessage);
    this.name = 'OcrError';
    this.type = details.type;
    this.userMessage = details.userMessage;
    this.technicalMessage = details.technicalMessage;
    this.recoverable = details.recoverable;
    this.retryable = details.retryable;
    this.suggestedAction = details.suggestedAction;
    this.originalError = details.originalError;
  }

  /**
   * 에러 정보를 구조화된 객체로 반환
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      recoverable: this.recoverable,
      retryable: this.retryable,
      suggestedAction: this.suggestedAction,
      originalError: this.originalError instanceof Error
        ? { message: this.originalError.message, stack: this.originalError.stack }
        : this.originalError,
    };
  }
}
