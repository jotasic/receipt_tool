import type { Category } from '@/types';

/**
 * 기본 카테고리 목록
 * @deprecated Legacy category system - use DEFAULT_USAGE_PURPOSES instead
 * ID는 /services/database/schema.ts의 DEFAULT_CATEGORIES와 일치해야 합니다.
 * Kept for backward compatibility with old receipt data only.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: '식비', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'transport', name: '교통비', icon: 'car', color: '#4ECDC4' },
  { id: 'shopping', name: '쇼핑', icon: 'cart', color: '#95E1D3' },
  { id: 'entertainment', name: '엔터테인먼트', icon: 'film', color: '#F38181' },
  { id: 'utilities', name: '공과금', icon: 'home', color: '#AA96DA' },
  { id: 'medical', name: '의료', icon: 'medkit', color: '#FCBAD3' },
  { id: 'education', name: '교육', icon: 'book', color: '#A8D8EA' },
  { id: 'other', name: '기타', icon: 'ellipsis-horizontal', color: '#C7CEEA' },
];
