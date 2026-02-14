/**
 * Mock OCR Provider
 * Expo Go에서 테스트용으로 사용
 * 실제 이미지 분석 없이 샘플 데이터 반환
 */

import type { OcrResult } from '../types';

// 샘플 영수증 데이터들
const SAMPLE_RECEIPTS = [
  {
    text: `스타벅스 강남점
사업자번호: 123-45-67890
서울시 강남구 테헤란로 123

---------------------------
아메리카노(Tall)      4,500원
카페라떼(Grande)     5,500원
---------------------------
합계                10,000원
---------------------------
결제일시: 2024-01-15 14:30
카드결제: 신한카드
승인번호: 12345678

감사합니다`,
    storeName: '스타벅스 강남점',
    amount: 10000,
    date: '2024-01-15',
  },
  {
    text: `CU 편의점
사업자번호: 234-56-78901
서울시 서초구 서초대로 456

---------------------------
삼각김밥               1,500원
컵라면                 1,800원
음료수                 2,000원
---------------------------
합계금액              5,300원
---------------------------
2024.02.20 18:45
현금결제

감사합니다`,
    storeName: 'CU 편의점',
    amount: 5300,
    date: '2024-02-20',
  },
  {
    text: `맥도날드 역삼점
McDonald's
사업자번호: 345-67-89012

빅맥세트              7,900원
맥너겟 6조각          3,500원
---------------------------
총액                 11,400원
---------------------------
결제: 2024-03-10 12:15
카드: KB국민카드

방문해주셔서 감사합니다`,
    storeName: '맥도날드 역삼점',
    amount: 11400,
    date: '2024-03-10',
  },
];

let sampleIndex = 0;

/**
 * Mock OCR - 개발/테스트용
 * 실제 이미지를 분석하지 않고 샘플 데이터 반환
 */
export async function mockExtractText(_imageUri: string): Promise<string> {
  // 약간의 딜레이로 실제 OCR처럼 보이게
  await new Promise(resolve => setTimeout(resolve, 800));

  const sample = SAMPLE_RECEIPTS[sampleIndex % SAMPLE_RECEIPTS.length];
  sampleIndex++;

  return sample.text;
}

/**
 * Mock OCR - 상세 결과
 */
export async function mockExtractTextDetailed(_imageUri: string): Promise<OcrResult> {
  const text = await mockExtractText(_imageUri);

  // 간단한 블록 구조 생성
  const lines = text.split('\n').filter(line => line.trim());

  return {
    text,
    blocks: [{
      text,
      lines: lines.map(line => ({
        text: line,
        elements: line.split(' ').filter(word => word.trim()).map(word => ({
          text: word,
        })),
      })),
    }],
  };
}

/**
 * 현재 Mock 모드임을 알리는 플래그
 */
export const isMockProvider = true;
