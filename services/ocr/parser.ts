/**
 * 영수증 텍스트 파싱 유틸리티
 * OCR로 추출된 텍스트에서 영수증 정보(금액, 날짜, 상호명) 파싱
 */

/**
 * 파싱된 영수증 데이터
 */
export interface ParsedReceipt {
  /** 상호명 (가게 이름) */
  storeName?: string;
  /** 날짜 (YYYY-MM-DD 형식) */
  date?: string;
  /** 금액 (정수, 원 단위) */
  amount?: number;
  /** 원본 OCR 텍스트 */
  rawText: string;
}

/**
 * 영수증 텍스트 파싱
 * @param rawText OCR로 추출된 원본 텍스트
 * @returns 파싱된 영수증 정보
 */
export function parseReceiptText(rawText: string): ParsedReceipt {
  const result: ParsedReceipt = { rawText };

  // 1. 금액 추출 (정규식)
  // 패턴: ₩123,456 / 123,456원 / 합계: 123,456 / 총액: 123,456
  const amountPatterns = [
    /합계[:\s]*([0-9,]+)/,
    /총액[:\s]*([0-9,]+)/,
    /결제금액[:\s]*([0-9,]+)/,
    /₩\s*([0-9,]+)/,
    /([0-9,]+)\s*원/,
  ];

  for (const pattern of amountPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      result.amount = parseInt(match[1].replace(/,/g, ''), 10);
      break;
    }
  }

  // 2. 날짜 추출
  // 패턴: 2024-01-15 / 2024.01.15 / 2024/01/15 / 24.01.15
  const datePatterns = [
    /(\d{4}[-./]\d{2}[-./]\d{2})/,
    /(\d{2}[-./]\d{2}[-./]\d{2})/,
  ];

  for (const pattern of datePatterns) {
    const match = rawText.match(pattern);
    if (match) {
      result.date = normalizeDate(match[1]);
      break;
    }
  }

  // 3. 상호명 추출 (첫 줄 또는 특정 패턴)
  const lines = rawText.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    // 첫 줄이 상호명인 경우가 많음
    result.storeName = lines[0].trim();
  }

  return result;
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 정규화
 * @param dateStr 날짜 문자열 (다양한 형식)
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
function normalizeDate(dateStr: string): string {
  // YYYY-MM-DD 형식으로 정규화
  const parts = dateStr.split(/[-./]/);
  if (parts.length === 3) {
    let year = parts[0];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return dateStr;
}
