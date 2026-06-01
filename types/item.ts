/**
 * Unified Item Type Definition
 *
 * This file defines the core Item model that represents all expense-related documents
 * in the system using a unified approach (Option A architecture).
 *
 * Key Design Principles:
 * - Single Item type for all expense documents (receipts, proofs, etc.)
 * - 2D classification: ItemClassification × UsagePurpose
 * - Optional financial fields for proof documents
 * - Clear distinction between items requiring submission vs. tracking-only
 */

import type { Tag } from './tag';
import type { CustomFieldValue } from './customField';

/**
 * ItemClassification - Primary categorization of items
 *
 * Determines how the item should be processed in the expense workflow:
 * - personal_card: Requires reimbursement submission to company
 * - corporate_card: Company card, tracking only, no submission needed
 * - proof_document: Supporting documentation (medical statements, certificates, etc.)
 */
export type ItemClassification =
  | 'personal_card'    // 개인카드 - needs reimbursement submission
  | 'corporate_card'   // 법인카드 - tracking only, no submission
  | 'proof_document';  // 증명 - supporting documents (medical statements, etc.)

/**
 * UsagePurpose - Secondary categorization by expense type
 *
 * Represents the purpose/category of the expense.
 * Used for reporting, filtering, and categorization across all item types.
 *
 * Note: This is stored in the usage_purposes table and is user-extensible.
 */
export type UsagePurpose = string;

/**
 * Item - Unified expense document model
 *
 * Represents any expense-related item in the system, whether it's a receipt,
 * proof document, or other supporting material.
 *
 * The 2D classification system (classification × usagePurpose) allows for:
 * - Personal card meal receipts (personal_card + meal)
 * - Corporate card transportation (corporate_card + transportation)
 * - Medical proof documents (proof_document + medical)
 * - And any other combination
 *
 * Financial fields (amount, storeName) are optional to support proof documents
 * that may not have associated monetary values.
 */
export interface Item {
  /** Unique identifier */
  id: string;

  /** Display name/description of the item */
  title: string;

  // ============================================
  // Core Classification (2D)
  // ============================================

  /** Primary classification - determines workflow (submission vs tracking) */
  classification: ItemClassification;

  /** Usage purpose/category - for reporting and organization */
  usagePurpose: UsagePurpose;

  // ============================================
  // Space & Classification (Phase 2)
  // ============================================

  /**
   * Space FK - top-level grouping (e.g. 회사, 개인)
   * Optional for backward compatibility with pre-Phase2 records
   */
  spaceId?: string;

  /**
   * Classification FK - replaces legacy classification enum over time.
   * Optional for backward compatibility; legacy 'classification' field is kept.
   */
  classificationId?: string;

  /**
   * Tags associated with this item
   * Optional - loaded when needed via JOIN query
   */
  tags?: Tag[];

  /**
   * Custom field values for this item
   * Optional - loaded when needed via JOIN query
   */
  customValues?: CustomFieldValue[];

  // ============================================
  // Financial Data
  // ============================================

  /**
   * Transaction amount
   * Optional - proof documents may not have an amount
   */
  amount?: number;

  /**
   * Transaction or document date (ISO 8601 format: YYYY-MM-DD)
   * Required for all items
   */
  date: string;

  /**
   * Store/merchant name
   * Optional - may not apply to all document types
   */
  storeName?: string;

  // ============================================
  // File/Image Data
  // ============================================

  /**
   * Path to the stored file/image
   * Relative to the app's document directory
   */
  filePath?: string;

  /**
   * MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
   */
  fileType?: string;

  /**
   * Extracted text from OCR processing
   * Stored for search and reference purposes
   */
  ocrText?: string;

  // ============================================
  // Metadata
  // ============================================

  /** User-added notes or comments */
  memo?: string;

  /** Creation timestamp (ISO 8601 format) */
  createdAt: string;

  /** Last update timestamp (ISO 8601 format) */
  updatedAt: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Determines if an item requires submission for reimbursement
 *
 * Only personal card expenses need to be submitted to the company.
 * Corporate card and proof documents are for tracking/reference only.
 *
 * @param item - The item to check
 * @returns true if the item requires submission, false otherwise
 *
 * @example
 * const personalReceipt = { classification: 'personal_card', ... };
 * requiresSubmission(personalReceipt); // true
 *
 * const corporateReceipt = { classification: 'corporate_card', ... };
 * requiresSubmission(corporateReceipt); // false
 */
export function requiresSubmission(item: Item): boolean {
  return item.classification === 'personal_card';
}

/**
 * Determines if an item is a proof document
 *
 * Proof documents are supporting materials (medical statements, certificates, etc.)
 * that may not have standard receipt fields like amount or store name.
 *
 * @param item - The item to check
 * @returns true if the item is a proof document, false otherwise
 *
 * @example
 * const medicalCert = { classification: 'proof_document', ... };
 * isProofDocument(medicalCert); // true
 *
 * const receipt = { classification: 'personal_card', ... };
 * isProofDocument(receipt); // false
 */
export function isProofDocument(item: Item): boolean {
  return item.classification === 'proof_document';
}

/**
 * Determines if an item represents an expense with financial data
 *
 * Expenses are items that involve monetary transactions (personal or corporate card).
 * Proof documents typically don't represent direct expenses.
 *
 * @param item - The item to check
 * @returns true if the item is an expense, false otherwise
 *
 * @example
 * const receipt = { classification: 'personal_card', ... };
 * isExpense(receipt); // true
 *
 * const proof = { classification: 'proof_document', ... };
 * isExpense(proof); // false
 */
export function isExpense(item: Item): boolean {
  return item.classification === 'personal_card' || item.classification === 'corporate_card';
}

// ============================================
// Input Types for CRUD Operations
// ============================================

/**
 * CreateItemInput - Data required to create a new item
 *
 * Omits system-generated fields (id, createdAt, updatedAt) that are
 * automatically set during creation.
 *
 * @example
 * const newItem: CreateItemInput = {
 *   title: '스타벅스 커피',
 *   classification: 'personal_card',
 *   usagePurpose: 'meal',
 *   amount: 4500,
 *   date: '2026-02-15',
 *   storeName: '스타벅스 강남점',
 *   tags: ['tag-id-1', 'tag-id-2'], // Optional tag IDs
 * };
 */
export interface CreateItemInput extends Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'tags' | 'customValues'> {
  /** Array of tag IDs to associate with this item */
  tags?: string[];
  /** Custom field values as Record<fieldId, value> */
  customValues?: Record<string, string | null>;
}

/**
 * UpdateItemInput - Data allowed for updating an existing item
 *
 * All fields are optional (partial update support) and system-managed
 * fields are excluded.
 *
 * @example
 * const updates: UpdateItemInput = {
 *   amount: 5000,
 *   memo: '회의 중 간식 구매',
 * };
 */
export type UpdateItemInput = Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================
// Type Guards
// ============================================

/**
 * Type guard to check if a value is a valid ItemClassification
 */
export function isItemClassification(value: unknown): value is ItemClassification {
  return (
    typeof value === 'string' &&
    ['personal_card', 'corporate_card', 'proof_document'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid UsagePurpose
 */
export function isUsagePurpose(value: unknown): value is UsagePurpose {
  return (
    typeof value === 'string' &&
    ['meal', 'transportation', 'medical', 'other'].includes(value)
  );
}

/**
 * Validates if an object has the minimum required fields to be an Item
 *
 * Note: This is a runtime validation helper. For compile-time safety,
 * use TypeScript's type system.
 */
export function isValidItem(obj: unknown): obj is Item {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const item = obj as Partial<Item>;

  return !!(
    item.id &&
    item.title &&
    isItemClassification(item.classification) &&
    isUsagePurpose(item.usagePurpose) &&
    item.date &&
    item.createdAt &&
    item.updatedAt
  );
}
