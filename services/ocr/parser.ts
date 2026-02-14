/**
 * 영수증 텍스트 파싱 유틸리티
 * OCR로 추출된 텍스트에서 영수증 정보(금액, 날짜, 상호명) 파싱
 */

import { ocrLogger } from './logger';
import {
  amountPatterns,
  amountCandidatePatterns,
  excludeIdPatterns,
  datePatterns,
  dateValidRange,
  storeNamePatterns,
  storeNameExcludeKeywords,
} from './patterns';

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

  // 디버그: 원본 텍스트 전체 출력
  console.log('========== OCR 원본 텍스트 ==========');
  console.log(rawText);
  console.log('======================================');

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
  // 1단계: 키워드 기반 금액 찾기 (가장 신뢰도 높음)
  const keywordPatterns = [
    ...amountPatterns.koreanKeywords,
    ...amountPatterns.englishKeywords,
  ];

  for (const keyword of keywordPatterns) {
    const regex = new RegExp(keyword + '[:\\s]*([\\d,.\\ \\O]+)', 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      const amount = parseAmount(match[1]);
      const { min, max } = amountPatterns.validRange;
      if (amount >= min && amount <= max) {
        ocrLogger.debug('키워드 기반 금액 추출', { keyword, amount });
        return { value: amount, pattern: keyword };
      }
    }
  }

  // 2단계: 통화 기호 기반
  for (const pattern of amountPatterns.currencyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseAmount(match[1]);
      const { min, max } = amountPatterns.validRange;
      if (amount >= min && amount <= max) {
        ocrLogger.debug('통화기호 기반 금액 추출', { amount });
        return { value: amount, pattern: 'currency' };
      }
    }
  }

  // 3단계: 모든 금액 후보 찾기 (독립적인 숫자들)
  const allAmounts = findAllAmountCandidates(text);
  if (allAmounts.length > 0) {
    // 가장 큰 금액 반환 (보통 총액이 가장 큼)
    const sorted = allAmounts.sort((a, b) => b - a);
    const maxAmount = sorted[0];
    ocrLogger.debug('후보 금액들', { candidates: sorted.slice(0, 5) });
    return { value: maxAmount, pattern: 'standalone' };
  }

  return {};
}

/**
 * 금액 문자열 파싱 (다양한 OCR 오류 보정)
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;

  let cleaned = amountStr.trim();

  // OCR 오류 보정 (패턴 설정에서 가져옴)
  const errorMapping = amountPatterns.ocrErrorMapping;
  for (const [wrong, correct] of Object.entries(errorMapping)) {
    cleaned = cleaned.replace(new RegExp(wrong, 'g'), correct);
  }

  // 공백, 쉼표 제거
  cleaned = cleaned.replace(/[\s,]/g, '');

  // 점 처리: 천 단위 구분자인 경우 제거
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    // 모든 점 뒤가 3자리씩이면 천 단위 구분자
    const isThousandSeparator = parts.slice(1).every(p => p.length === 3);
    if (isThousandSeparator) {
      cleaned = parts.join('');
    } else {
      // 그 외의 경우도 점 제거 (한국 원화는 소수점 없음)
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  // 끝에 붙은 잘못 인식된 문자 처리
  // 예: "60,0001" → 60000 (1이 "원"으로 오인식)
  // 예: "60,000I" → 60000 (I가 붙음)
  cleaned = cleaned.replace(/[^0-9]$/, '');

  // 마지막 자리가 1이고 그 앞이 0인 경우 (예: "600001") → 잘못 인식된 "원"
  if (cleaned.length >= 4) {
    const lastDigit = cleaned.slice(-1);
    const beforeLast = cleaned.slice(-2, -1);
    if (lastDigit === '1' && beforeLast === '0') {
      // 1000원 단위로 끝나는지 확인 (예: 60000 → 6만원)
      const withoutLast = cleaned.slice(0, -1);
      if (parseInt(withoutLast) % 1000 === 0) {
        cleaned = withoutLast;
      }
    }
  }

  const result = parseInt(cleaned, 10);
  return isNaN(result) ? 0 : result;
}

/**
 * 텍스트에서 모든 금액 후보 찾기
 */
function findAllAmountCandidates(text: string): number[] {
  const amounts: number[] = [];
  const seen = new Set<number>();

  // ID/참조번호로 보이는 패턴 제외
  const cleanedText = text.replace(excludeIdPatterns.keywords, '');

  // 숫자 뒤에 특수문자가 바로 붙어있으면 ID로 간주
  const lines = cleanedText.split('\n');
  const validLines = lines.filter(line => {
    // 숫자+특수문자 조합은 ID로 간주
    if (excludeIdPatterns.specialChars.test(line)) return false;
    return true;
  });
  const filteredText = validLines.join('\n');

  // 금액 후보 패턴 매칭
  for (const pattern of amountCandidatePatterns) {
    let match;
    while ((match = pattern.exec(filteredText)) !== null) {
      const amount = parseAmount(match[1]);
      const { min, max } = amountPatterns.candidateRange;
      if (amount >= min && amount <= max && !seen.has(amount)) {
        amounts.push(amount);
        seen.add(amount);
      }
    }
  }

  // 금액 우선순위 정렬:
  // 1. 천원 단위로 떨어지는 금액 우선 (예: 60000, 15000)
  // 2. 백원 단위로 떨어지는 금액 (예: 12500)
  // 3. 그 외
  amounts.sort((a, b) => {
    const aRoundScore = a % 1000 === 0 ? 2 : a % 100 === 0 ? 1 : 0;
    const bRoundScore = b % 1000 === 0 ? 2 : b % 100 === 0 ? 1 : 0;

    if (aRoundScore !== bRoundScore) {
      return bRoundScore - aRoundScore; // 더 둥근 숫자 우선
    }

    // 같은 라운드 스코어면 큰 금액 우선 (단, 100만원 이하 선호)
    const aPreferred = a <= 1000000 ? a : a / 10;
    const bPreferred = b <= 1000000 ? b : b / 10;
    return bPreferred - aPreferred;
  });

  return amounts;
}

/**
 * 날짜 추출
 */
function extractDate(text: string): { value?: string; pattern?: string } {
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

  const { lengthRange } = storeNamePatterns;

  // 방법 0: (주), (유), (합) 등 법인명 패턴 찾기 (가장 정확)
  for (const line of lines) {
    for (const corpPattern of storeNamePatterns.corporationPatterns) {
      const corpMatch = line.match(corpPattern);
      if (corpMatch) {
        const storeName = corpMatch[0].trim();
        // 제외 키워드 체크
        const shouldExclude = storeNameExcludeKeywords.some(keyword =>
          storeName.toUpperCase().includes(keyword.toUpperCase())
        );
        if (!shouldExclude && storeName.length >= 4 && storeName.length <= lengthRange.max) {
          return { value: storeName, method: '법인명' };
        }
      }
    }
  }

  // 방법 1: 상호명 키워드 패턴 찾기
  for (const line of lines) {
    for (const keywordPattern of storeNamePatterns.nameKeywordPatterns) {
      const match = line.match(keywordPattern);
      if (match && match[1]) {
        const storeName = match[1].trim();
        const shouldExclude = storeNameExcludeKeywords.some(keyword =>
          storeName.toUpperCase().includes(keyword.toUpperCase())
        );
        if (!shouldExclude && storeName.length >= lengthRange.min && storeName.length <= lengthRange.max) {
          const methodName = keywordPattern.source.includes('명') ? '명키워드' :
                            keywordPattern.source.includes('가맹') ? '가맹점' : '상호';
          return { value: storeName, method: methodName };
        }
      }
    }
  }

  // 방법 2: 유효한 첫 줄 찾기 (제외 키워드 건너뛰기)
  const { maxDigitRatio, maxSpecialCharRatio } = storeNamePatterns.validationRules;

  for (const line of lines) {
    const trimmed = line.trim();

    // 제외 키워드 체크
    const shouldExclude = storeNameExcludeKeywords.some(keyword =>
      trimmed.toUpperCase().includes(keyword.toUpperCase())
    );

    if (shouldExclude) continue;

    // 숫자로만 구성된 줄 제외
    if (/^[\d\s\-:./]+$/.test(trimmed)) continue;

    // 숫자가 설정된 비율 이상인 줄 제외 (ID, 전화번호 등)
    const digitCount = (trimmed.match(/\d/g) || []).length;
    if (digitCount / trimmed.length > maxDigitRatio) continue;

    // 숫자+특수문자 조합 제외
    if (excludeIdPatterns.specialChars.test(trimmed)) continue;

    // 길이 제한
    if (trimmed.length < lengthRange.min || trimmed.length > lengthRange.max) continue;

    // 특수문자가 너무 많은 줄 제외
    const specialCharRatio = (trimmed.match(/[^a-zA-Z가-힣0-9\s]/g) || []).length / trimmed.length;
    if (specialCharRatio > maxSpecialCharRatio) continue;

    // 한글이 하나라도 있으면 우선 반환 (한국 상호명은 보통 한글 포함)
    if (/[가-힣]/.test(trimmed)) {
      return { value: trimmed, method: 'first-valid-korean-line' };
    }
  }

  // 한글 없는 유효한 줄 찾기 (영문 상호명)
  for (const line of lines) {
    const trimmed = line.trim();

    const shouldExclude = storeNameExcludeKeywords.some(keyword =>
      trimmed.toUpperCase().includes(keyword.toUpperCase())
    );
    if (shouldExclude) continue;
    if (/^[\d\s\-:./]+$/.test(trimmed)) continue;

    const digitCount = (trimmed.match(/\d/g) || []).length;
    if (digitCount / trimmed.length > maxDigitRatio) continue;
    if (excludeIdPatterns.specialChars.test(trimmed)) continue;
    if (trimmed.length < lengthRange.min || trimmed.length > lengthRange.max) continue;

    const specialCharRatio = (trimmed.match(/[^a-zA-Z가-힣0-9\s]/g) || []).length / trimmed.length;
    if (specialCharRatio > maxSpecialCharRatio) continue;

    return { value: trimmed, method: 'first-valid-line' };
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

  // 유효 연도 범위 확인
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  const { minYear, maxYearOffset } = dateValidRange;
  if (year < minYear || year > currentYear + maxYearOffset) {
    return false;
  }

  return true;
}
