/**
 * Unit tests for type guard and helper functions in types/item.ts
 */

import {
  requiresSubmission,
  isProofDocument,
  isExpense,
  isItemClassification,
  isUsagePurpose,
  isValidItem,
  type Item,
} from '../../types/item';

// ============================================
// Test fixture helpers
// ============================================

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    title: '테스트 항목',
    classification: 'personal_card',
    usagePurpose: 'meal',
    date: '2026-02-25',
    createdAt: '2026-02-25T00:00:00.000Z',
    updatedAt: '2026-02-25T00:00:00.000Z',
    ...overrides,
  };
}

// ============================================
// requiresSubmission
// ============================================

describe('requiresSubmission', () => {
  it('returns true for personal_card items', () => {
    const item = makeItem({ classification: 'personal_card' });
    expect(requiresSubmission(item)).toBe(true);
  });

  it('returns false for corporate_card items', () => {
    const item = makeItem({ classification: 'corporate_card' });
    expect(requiresSubmission(item)).toBe(false);
  });

  it('returns false for proof_document items', () => {
    const item = makeItem({ classification: 'proof_document' });
    expect(requiresSubmission(item)).toBe(false);
  });
});

// ============================================
// isProofDocument
// ============================================

describe('isProofDocument', () => {
  it('returns true for proof_document items', () => {
    const item = makeItem({ classification: 'proof_document' });
    expect(isProofDocument(item)).toBe(true);
  });

  it('returns false for personal_card items', () => {
    const item = makeItem({ classification: 'personal_card' });
    expect(isProofDocument(item)).toBe(false);
  });

  it('returns false for corporate_card items', () => {
    const item = makeItem({ classification: 'corporate_card' });
    expect(isProofDocument(item)).toBe(false);
  });
});

// ============================================
// isExpense
// ============================================

describe('isExpense', () => {
  it('returns true for personal_card items', () => {
    const item = makeItem({ classification: 'personal_card' });
    expect(isExpense(item)).toBe(true);
  });

  it('returns true for corporate_card items', () => {
    const item = makeItem({ classification: 'corporate_card' });
    expect(isExpense(item)).toBe(true);
  });

  it('returns false for proof_document items', () => {
    const item = makeItem({ classification: 'proof_document' });
    expect(isExpense(item)).toBe(false);
  });
});

// ============================================
// isItemClassification
// ============================================

describe('isItemClassification', () => {
  it('returns true for "personal_card"', () => {
    expect(isItemClassification('personal_card')).toBe(true);
  });

  it('returns true for "corporate_card"', () => {
    expect(isItemClassification('corporate_card')).toBe(true);
  });

  it('returns true for "proof_document"', () => {
    expect(isItemClassification('proof_document')).toBe(true);
  });

  it('returns false for an unknown string', () => {
    expect(isItemClassification('unknown')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isItemClassification('')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isItemClassification(42)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isItemClassification(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isItemClassification(undefined)).toBe(false);
  });

  it('returns false for an object', () => {
    expect(isItemClassification({ classification: 'personal_card' })).toBe(false);
  });
});

// ============================================
// isUsagePurpose
// ============================================

describe('isUsagePurpose', () => {
  it('returns true for "meal"', () => {
    expect(isUsagePurpose('meal')).toBe(true);
  });

  it('returns true for "transportation"', () => {
    expect(isUsagePurpose('transportation')).toBe(true);
  });

  it('returns true for "medical"', () => {
    expect(isUsagePurpose('medical')).toBe(true);
  });

  it('returns true for "other"', () => {
    expect(isUsagePurpose('other')).toBe(true);
  });

  it('returns false for an unknown string', () => {
    expect(isUsagePurpose('entertainment')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isUsagePurpose('')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isUsagePurpose(0)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUsagePurpose(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isUsagePurpose(undefined)).toBe(false);
  });
});

// ============================================
// isValidItem
// ============================================

describe('isValidItem', () => {
  it('returns true for a fully valid item', () => {
    expect(isValidItem(makeItem())).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidItem(null)).toBe(false);
  });

  it('returns false for a primitive value', () => {
    expect(isValidItem('not-an-item')).toBe(false);
    expect(isValidItem(123)).toBe(false);
  });

  it('returns false when id is missing', () => {
    const obj = { ...makeItem(), id: '' };
    expect(isValidItem(obj)).toBe(false);
  });

  it('returns false when title is missing', () => {
    const obj = { ...makeItem(), title: '' };
    expect(isValidItem(obj)).toBe(false);
  });

  it('returns false when classification is invalid', () => {
    const obj = { ...makeItem(), classification: 'invalid' as never };
    expect(isValidItem(obj)).toBe(false);
  });

  it('returns false when usagePurpose is invalid', () => {
    const obj = { ...makeItem(), usagePurpose: 'invalid_purpose' };
    expect(isValidItem(obj)).toBe(false);
  });

  it('returns false when date is missing', () => {
    const obj = { ...makeItem(), date: '' };
    expect(isValidItem(obj)).toBe(false);
  });
});
