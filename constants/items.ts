import type { UsagePurposeConfig, ClassificationConfig } from '@/types/shared';

/**
 * Usage purpose configurations for UI
 */
export const USAGE_PURPOSES: UsagePurposeConfig[] = [
  {
    id: 'meal',
    name: '식대',
    nameEn: 'Meal',
    icon: 'restaurant',
    color: '#FF6B6B',
    displayOrder: 1
  },
  {
    id: 'transportation',
    name: '교통비',
    nameEn: 'Transportation',
    icon: 'car',
    color: '#4ECDC4',
    displayOrder: 2
  },
  {
    id: 'medical',
    name: '의료비',
    nameEn: 'Medical',
    icon: 'medical',
    color: '#FCBAD3',
    displayOrder: 3
  },
  {
    id: 'other',
    name: '기타',
    nameEn: 'Other',
    icon: 'ellipsis-horizontal',
    color: '#C7CEEA',
    displayOrder: 4
  },
];

/**
 * Classification configurations for UI
 */
export const CLASSIFICATIONS: ClassificationConfig[] = [
  {
    id: 'personal_card',
    name: '개인카드',
    description: '개인카드 사용 - 영수증 제출 필요',
    icon: 'card',
    color: '#3B82F6',
    requiresSubmission: true,
  },
  {
    id: 'corporate_card',
    name: '법인카드',
    description: '법인카드 사용 - 기록용',
    icon: 'business',
    color: '#10B981',
    requiresSubmission: false,
  },
  {
    id: 'proof_document',
    name: '증명',
    description: '증빙 서류 (의료 세부내역서 등)',
    icon: 'document-text',
    color: '#8B5CF6',
    requiresSubmission: true,
  },
];

/**
 * Helper to get usage purpose config by id
 */
export function getUsagePurposeConfig(id: string): UsagePurposeConfig | undefined {
  return USAGE_PURPOSES.find(p => p.id === id);
}

/**
 * Helper to get classification config by id
 */
export function getClassificationConfig(id: string): ClassificationConfig | undefined {
  return CLASSIFICATIONS.find(c => c.id === id);
}
