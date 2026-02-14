/**
 * OCR 파싱 패턴 설정
 * 영수증 텍스트 파싱에 사용되는 정규식 패턴과 키워드 관리
 */

/**
 * 금액 추출 패턴 설정
 */
export const amountPatterns = {
  /** 금액 관련 한글 키워드 */
  koreanKeywords: [
    '합계', '총액', '총합', '결제금액', '지불금액', '받을금액',
    '승인금액', '거래금액', '매출금액', '결제', '금액', '총',
    '카드', '현금', '실결제',
  ],

  /** 금액 관련 영문 키워드 */
  englishKeywords: [
    'total', 'amount', 'sum', 'payment',
  ],

  /** 통화 기호 패턴 */
  currencyPatterns: [
    /₩\s*([\d,.\s]+)/,
    /\\\s*([\d,.\s]+)/,
    /([\d,.\s]+)\s*원/,
    /([\d,.\s]+)\s*won/i,
  ],

  /** 금액 유효 범위 */
  validRange: {
    min: 100,
    max: 50000000,
  },

  /** 금액 후보 유효 범위 */
  candidateRange: {
    min: 100,
    max: 10000000,
  },

  /** OCR 오류 보정 매핑 */
  ocrErrorMapping: {
    'O': '0',
    'o': '0',
    'l': '1',
    'I': '1',
  },
};

/**
 * 금액 후보 추출 패턴
 */
export const amountCandidatePatterns = [
  // 쉼표 구분 (정상): 60,000 / 1,234,567
  /\b(\d{1,3}(?:,\d{3})+)\b/g,

  // 점 구분 (OCR 오류): 60.000 / 1.234.567
  /\b(\d{1,3}(?:\.\d{3})+)\b/g,

  // 공백 구분 (OCR 오류): 60 000
  /\b(\d{1,3}(?:\s\d{3})+)\b/g,

  // 끝에 1 붙은 경우 (원 오인식): 60,0001, 600001
  /\b(\d{1,3}(?:,\d{3})*1)\b/g,
];

/**
 * ID/참조번호 제외 패턴
 */
export const excludeIdPatterns = {
  /** ID 키워드 패턴 */
  keywords: /(?:TID|DNo|HNo|SeI|No|ID)[:\s]*[\d]+/gi,

  /** 숫자+특수문자 조합 (예: 40457700*x17x) */
  specialChars: /\d+[*xX#@]+/,
};

/**
 * 날짜 추출 패턴 설정
 */
export const datePatterns = [
  // YYYY-MM-DD 형식
  {
    pattern: /(\d{4})[-./년](\d{1,2})[-./월](\d{1,2})[일]?/i,
    name: 'YYYY-MM-DD'
  },

  // YY-MM-DD 형식
  {
    pattern: /(\d{2})[-./년](\d{1,2})[-./월](\d{1,2})[일]?/i,
    name: 'YY-MM-DD'
  },

  // ISO 형식
  {
    pattern: /(\d{4})[-/](\d{2})[-/](\d{2})/i,
    name: 'ISO'
  },

  // 시간 포함 패턴 (날짜 부분만 추출)
  {
    pattern: /(\d{4})[-./](\d{2})[-./](\d{2})\s+\d{2}:\d{2}/i,
    name: 'DateTime'
  },
];

/**
 * 날짜 유효성 범위
 */
export const dateValidRange = {
  minYear: 1900,
  maxYearOffset: 1, // 현재 연도 + 1년까지 허용
};

/**
 * 상호명 추출 패턴 설정
 */
export const storeNamePatterns = {
  /** 법인명 패턴 */
  corporationPatterns: [
    // (주)회사명 패턴
    /[\(（]\s*주\s*[\)）]\s*([가-힣a-zA-Z0-9\s]+)/i,
    // 회사명(주) 패턴
    /([가-힣a-zA-Z0-9\s]+)\s*[\(（]\s*주\s*[\)）]/i,
  ],

  /** 상호명 키워드 패턴 */
  nameKeywordPatterns: [
    // "명 : 상호명" 패턴
    /명\s*[:\s]+(.+)/i,
    // "가맹점" 키워드
    /가\s*맹\s*점[명]?[:\s]*(.+)/i,
    // "상호" 키워드
    /상\s*호[:\s]*(.+)/i,
  ],

  /** 상호명 길이 제한 */
  lengthRange: {
    min: 2,
    max: 50,
  },

  /** 유효성 검증 규칙 */
  validationRules: {
    /** 숫자 비율 최대값 (50% 이상이면 ID로 간주) */
    maxDigitRatio: 0.5,
    /** 특수문자 비율 최대값 */
    maxSpecialCharRatio: 0.3,
  },
};

/**
 * 상호명 제외 키워드
 * 결제대행사, 카드사, 경고문구 등
 */
export const storeNameExcludeKeywords = [
  // 결제 대행사
  'KCP', 'NHN', 'NICE', 'KICC', 'KSNET', 'KOCES', 'SMARTRO',

  // ID/참조번호 관련
  'TID', 'DNo', 'HNo', 'SeI', 'crefia',

  // URL 관련
  'www.', 'http',

  // 일반적인 제외 단어
  'Swipe', '사이버결제', '한국사이버', '신고안내', '무편접수',
  '자세한', '감사합니다', '전표', '승인', '결제', '카드',
  '안내', '다를', '실제와', '고객', '매출',
];

/**
 * 새 패턴 추가 헬퍼 함수
 */
export const patternHelpers = {
  /**
   * 금액 키워드 패턴 추가
   */
  addAmountKeyword(keyword: string, language: 'korean' | 'english' = 'korean') {
    const target = language === 'korean'
      ? amountPatterns.koreanKeywords
      : amountPatterns.englishKeywords;

    if (!target.includes(keyword)) {
      target.push(keyword);
    }
  },

  /**
   * 날짜 패턴 추가
   */
  addDatePattern(pattern: RegExp, name: string) {
    datePatterns.push({ pattern, name });
  },

  /**
   * 상호명 제외 키워드 추가
   */
  addStoreNameExcludeKeyword(keyword: string) {
    if (!storeNameExcludeKeywords.includes(keyword)) {
      storeNameExcludeKeywords.push(keyword);
    }
  },

  /**
   * 통화 패턴 추가
   */
  addCurrencyPattern(pattern: RegExp) {
    amountPatterns.currencyPatterns.push(pattern);
  },
};
