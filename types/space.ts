/**
 * Space & Classification Type Definitions
 *
 * Space: A top-level grouping for expense items (e.g. 회사, 개인).
 * Classification: A sub-category within a Space (e.g. 개인카드, 법인카드, 증빙서류).
 *
 * Relationship: Space 1 → N Classification 1 → N Item
 */

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Space - Top-level grouping for expense items
 *
 * Each space represents an independent context (e.g. company, personal)
 * that contains its own set of classifications, usage purposes, tags, and
 * custom fields.
 */
export interface Space {
  /** Unique identifier */
  id: string;

  /** Display name (e.g. '회사', '개인') */
  name: string;

  /** Optional emoji or icon name */
  icon?: string | null;

  /** Optional color hex string (e.g. '#3B82F6') */
  color?: string | null;

  /** Order for display (ascending, 0-based) */
  displayOrder: number;

  /** Creation timestamp (ISO 8601) */
  createdAt: string;
}

/**
 * Classification - Sub-category within a Space
 *
 * Replaces the legacy ItemClassification enum ('personal_card' | 'corporate_card' |
 * 'proof_document') with a user-extensible DB-backed entity.
 */
export interface Classification {
  /** Unique identifier */
  id: string;

  /** Parent space ID */
  spaceId: string;

  /** Display name (e.g. '개인카드', '법인카드', '증빙서류') */
  name: string;

  /** Optional emoji or icon name */
  icon?: string | null;

  /** Optional color hex string */
  color?: string | null;

  /** Whether this classification is active (visible in UI) */
  isActive: boolean;

  /** Order for display within the parent space (ascending, 0-based) */
  displayOrder: number;

  /** Creation timestamp (ISO 8601) */
  createdAt: string;
}

// ============================================================================
// Input Types for CRUD Operations
// ============================================================================

/**
 * CreateSpaceInput - Data required to create a new space
 */
export interface CreateSpaceInput {
  name: string;
  icon?: string;
  color?: string;
}

/**
 * UpdateSpaceInput - Data allowed for updating an existing space
 *
 * All fields are optional (partial update support).
 */
export interface UpdateSpaceInput {
  name?: string;
  icon?: string | null;
  color?: string | null;
}

/**
 * CreateClassificationInput - Data required to create a new classification
 */
export interface CreateClassificationInput {
  spaceId: string;
  name: string;
  icon?: string;
  color?: string;
}

/**
 * UpdateClassificationInput - Data allowed for updating an existing classification
 *
 * All fields are optional (partial update support).
 */
export interface UpdateClassificationInput {
  name?: string;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
}
