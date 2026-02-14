/**
 * Shared usage purpose type
 */
export type UsagePurpose = 'meal' | 'transportation' | 'medical' | 'other';

/**
 * Usage purpose display configuration
 */
export interface UsagePurposeConfig {
  id: UsagePurpose;
  name: string;        // Korean name
  nameEn: string;      // English name
  icon: string;        // Ionicons name
  color: string;       // Hex color
  displayOrder: number;
}

/**
 * Item classification for filtering and display
 */
export type ItemClassification = 'personal_card' | 'corporate_card' | 'proof_document';

export interface ClassificationConfig {
  id: ItemClassification;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiresSubmission: boolean;
}
