/**
 * Usage Purpose Type Definitions
 *
 * Defines types for the usage_purposes table, which provides dynamic
 * categorization options for items (receipts, proof documents, etc.)
 */

/**
 * UsagePurpose - Represents a usage purpose/category for items
 *
 * Usage purposes are user-configurable categories that can be applied to items
 * for reporting, filtering, and organization purposes.
 *
 * Examples:
 * - meal (식대)
 * - transportation (교통비)
 * - medical (의료비)
 * - entertainment (접대비)
 * - other (기타)
 */
export interface UsagePurpose {
  /** Unique identifier */
  id: string;

  /** Korean name (primary) */
  name: string;

  /** English name (optional) */
  nameEn: string | null;

  /** Icon identifier (e.g., 'restaurant', 'car', 'medical') */
  icon: string | null;

  /** Color hex code (e.g., '#FF6B6B') */
  color: string | null;

  /** Whether this usage purpose is currently active/visible */
  isActive: boolean;

  /** Display order for sorting in UI (lower numbers appear first) */
  displayOrder: number;
}

/**
 * CreateUsagePurposeInput - Data required to create a new usage purpose
 *
 * All fields except name are optional. If not provided:
 * - id: auto-generated
 * - displayOrder: auto-assigned (max + 1)
 * - isActive: defaults to true
 *
 * @example
 * const newPurpose: CreateUsagePurposeInput = {
 *   name: '교통비',
 *   nameEn: 'Transportation',
 *   icon: 'car',
 *   color: '#4ECDC4',
 * };
 */
export interface CreateUsagePurposeInput {
  /** Optional ID (auto-generated if not provided) */
  id?: string;

  /** Korean name (required) */
  name: string;

  /** English name (optional) */
  nameEn?: string;

  /** Icon identifier (optional) */
  icon?: string;

  /** Color hex code (optional) */
  color?: string;

  /** Space ID this usage purpose belongs to (optional) */
  spaceId?: string;

  /** Display order (auto-assigned if not provided) */
  displayOrder?: number;
}

/**
 * UpdateUsagePurposeInput - Data allowed for updating an existing usage purpose
 *
 * All fields are optional (partial update support).
 *
 * @example
 * const updates: UpdateUsagePurposeInput = {
 *   name: '식비',
 *   color: '#FF6B6B',
 *   isActive: true,
 * };
 */
export interface UpdateUsagePurposeInput {
  /** Korean name */
  name?: string;

  /** English name */
  nameEn?: string;

  /** Icon identifier */
  icon?: string;

  /** Color hex code */
  color?: string;

  /** Active status */
  isActive?: boolean;

  /** Display order */
  displayOrder?: number;
}

// ============================================
// Constants
// ============================================

/**
 * Default usage purpose IDs that cannot be deleted
 *
 * These are the core usage purposes that are essential for the system.
 * Users can deactivate them but cannot delete them.
 */
export const DEFAULT_USAGE_PURPOSE_IDS = ['meal', 'other'] as const;

/**
 * Type for default usage purpose IDs
 */
export type DefaultUsagePurposeId = typeof DEFAULT_USAGE_PURPOSE_IDS[number];

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a usage purpose ID is a default (system) purpose
 *
 * @param id - Usage purpose ID to check
 * @returns true if the ID is a default purpose, false otherwise
 *
 * @example
 * isDefaultUsagePurpose('meal'); // true
 * isDefaultUsagePurpose('custom-purpose'); // false
 */
export function isDefaultUsagePurpose(id: string): boolean {
  return DEFAULT_USAGE_PURPOSE_IDS.includes(id as DefaultUsagePurposeId);
}

/**
 * Validates if a usage purpose object has all required fields
 *
 * @param obj - Object to validate
 * @returns true if valid, false otherwise
 */
export function isValidUsagePurpose(obj: unknown): obj is UsagePurpose {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const purpose = obj as Partial<UsagePurpose>;

  return !!(
    purpose.id &&
    purpose.name &&
    typeof purpose.isActive === 'boolean' &&
    typeof purpose.displayOrder === 'number'
  );
}

/**
 * Validates creation input
 *
 * @param input - Input to validate
 * @returns true if valid, false otherwise
 */
export function isValidCreateInput(input: unknown): input is CreateUsagePurposeInput {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  const data = input as Partial<CreateUsagePurposeInput>;

  return !!(data.name && typeof data.name === 'string' && data.name.trim().length > 0);
}
