/**
 * 영수증 텍스트 파싱 유틸리티
 * OCR로 추출된 텍스트에서 영수증 정보(금액, 날짜, 상호명) 파싱
 */

import { ocrLogger } from './logger';

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
  /** 파싱 신뢰도 (0-1) */
  confidence?: number;
  /** 파싱 경고 메시지 */
  warnings?: string[];
}

/**
 * 영수증 텍스트 파싱
 * @param rawText OCR로 추출된 원본 텍스트
 * @returns 파싱된 영수증 정보
 */
export function parseReceiptText(rawText: string): ParsedReceipt {
  ocrLogger.info('영수증 텍스트 파싱 시작', {
    textLength: rawText.length,
    lineCount: rawText.split('\n').length,
  });

  const result: ParsedReceipt = { rawText, warnings: [] };
  let matchedFields = 0;

  // 1. 금액 추출 (확장된 정규식 패턴)
  const amountResult = extractAmount(rawText);
  if (amountResult.value) {
    result.amount = amountResult.value;
    matchedFields++;
    ocrLogger.debug('금액 추출 성공', {
      amount: amountResult.value,
      pattern: amountResult.pattern,
    });
  } else {
    result.warnings?.push('금액을 찾을 수 없습니다');
    ocrLogger.warn('금액 추출 실패');
  }

  // 2. 날짜 추출 (확장된 정규식 패턴)
  const dateResult = extractDate(rawText);
  if (dateResult.value) {
    result.date = dateResult.value;
    matchedFields++;
    ocrLogger.debug('날짜 추출 성공', {
      date: dateResult.value,
      pattern: dateResult.pattern,
    });
  } else {
    result.warnings?.push('날짜를 찾을 수 없습니다');
    ocrLogger.warn('날짜 추출 실패');
  }

  // 3. 상호명 추출 (개선된 로직)
  const storeNameResult = extractStoreName(rawText);
  if (storeNameResult.value) {
    result.storeName = storeNameResult.value;
    matchedFields++;
    ocrLogger.debug('상호명 추출 성공', {
      storeName: storeNameResult.value,
      method: storeNameResult.method,
    });
  } else {
    result.warnings?.push('상호명을 찾을 수 없습니다');
    ocrLogger.warn('상호명 추출 실패');
  }

  // 4. 신뢰도 계산 (0-1 사이 값)
  result.confidence = matchedFields / 3;

  ocrLogger.info('영수증 텍스트 파싱 완료', {
    matchedFields,
    confidence: result.confidence,
    warnings: result.warnings?.length || 0,
  });

  return result;
}

/**
 * 금액 추출
 */
function extractAmount(text: string): { value?: number; pattern?: string } {
  // 확장된 금액 패턴 (우선순위 순)
  const amountPatterns = [
    // 1. 합계/총액/결제금액 (가장 신뢰도 높음)
    { pattern: /합\s*계[:\s]*([0-9,]+)/i, name: '합계' },
    { pattern: /총\s*액[:\s]*([0-9,]+)/i, name: '총액' },
    { pattern: /결\s*제\s*금\s*액[:\s]*([0-9,]+)/i, name: '결제금액' },
    { pattern: /지\s*불\s*금\s*액[:\s]*([0-9,]+)/i, name: '지불금액' },
    { pattern: /받\s*을\s*금\s*액[:\s]*([0-9,]+)/i, name: '받을금액' },

    // 2. 카드/현금 결제
    { pattern: /카\s*드[:\s]*([0-9,]+)/i, name: '카드' },
    { pattern: /현\s*금[:\s]*([0-9,]+)/i, name: '현금' },

    // 3. 영문 패턴
    { pattern: /total[:\s]*([0-9,]+)/i, name: 'TOTAL' },
    { pattern: /amount[:\s]*([0-9,]+)/i, name: 'AMOUNT' },

    // 4. 통화 기호
    { pattern: /₩\s*([0-9,]+)/i, name: '₩' },
    { pattern: /\\\s*([0-9,]+)/i, name: '\\' },

    // 5. 원 단위 (마지막 우선순위 - 다양한 금액이 있을 수 있음)
    { pattern: /([0-9,]{4,})\s*원/i, name: '원' },
  ];

  for (const { pattern, name } of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseInt(match[1].replace(/,/g, ''), 10);
      // 유효성 검증 (100원 ~ 10,000,000원)
      if (amount >= 100 && amount <= 10000000) {
        return { value: amount, pattern: name };
      }
    }
  }

  return {};
}

/**
 * 날짜 추출
 */
function extractDate(text: string): { value?: string; pattern?: string } {
  // 확장된 날짜 패턴
  const datePatterns = [
    // 1. YYYY-MM-DD 형식
    { pattern: /(\d{4})[-./년](\d{1,2})[-./월](\d{1,2})[일]?/i, name: 'YYYY-MM-DD' },

    // 2. YY-MM-DD 형식
    { pattern: /(\d{2})[-./년](\d{1,2})[-./월](\d{1,2})[일]?/i, name: 'YY-MM-DD' },

    // 3. 영문 날짜
    { pattern: /(\d{4})[-/](\d{2})[-/](\d{2})/i, name: 'ISO' },

    // 4. 시간 포함 패턴 (날짜 부분만 추출)
    { pattern: /(\d{4})[-./](\d{2})[-./](\d{2})\s+\d{2}:\d{2}/i, name: 'DateTime' },
  ];

  for (const { pattern, name } of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const normalized = normalizeDate(match[0]);
        // 날짜 유효성 검증
        if (isValidDate(normalized)) {
          return { value: normalized, pattern: name };
        }
      } catch (error) {
        ocrLogger.debug('날짜 정규화 실패', { match: match[0], error });
      }
    }
  }

  return {};
}

/**
 * 상호명 추출
 */
function extractStoreName(text: string): { value?: string; method?: string } {
  const lines = text.split('\n').filter(l => l.trim());

  if (lines.length === 0) {
    return {};
  }

  // 방법 1: 첫 줄 (가장 일반적)
  const firstLine = lines[0].trim();
  if (firstLine.length >= 2 && firstLine.length <= 50) {
    return { value: firstLine, method: 'first-line' };
  }

  // 방법 2: '상호' 또는 '사업자' 키워드 찾기
  for (const line of lines) {
    if (line.match(/상\s*호[:\s]/i) || line.match(/사\s*업\s*자[:\s]/i)) {
      const match = line.split(/[:\s]/);
      if (match.length > 1) {
        const storeName = match.slice(1).join('').trim();
        if (storeName.length >= 2 && storeName.length <= 50) {
          return { value: storeName, method: 'keyword' };
        }
      }
    }
  }

  // 방법 3: 두 번째 줄 시도 (첫 줄이 로고나 광고일 수 있음)
  if (lines.length > 1) {
    const secondLine = lines[1].trim();
    if (secondLine.length >= 2 && secondLine.length <= 50) {
      return { value: secondLine, method: 'second-line' };
    }
  }

  return {};
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 정규화
 * @param dateStr 날짜 문자열 (다양한 형식)
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
function normalizeDate(dateStr: string): string {
  // 한글 제거 (년, 월, 일)
  const cleaned = dateStr.replace(/[년월일\s]/g, '-');

  // YYYY-MM-DD 형식으로 정규화
  const parts = cleaned.split(/[-./]/);
  if (parts.length >= 3) {
    let year = parts[0];
    const month = parts[1];
    const day = parts[2];

    // 2자리 연도를 4자리로 변환
    if (year.length === 2) {
      const yearNum = parseInt(year, 10);
      // 50 이상이면 1900년대, 미만이면 2000년대로 가정
      year = yearNum >= 50 ? '19' + year : '20' + year;
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return dateStr;
}

/**
 * 날짜 유효성 검증
 */
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return false;
  }

  // 1900년 ~ 현재 + 1년 사이인지 확인
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear + 1) {
    return false;
  }

  return true;
}
