/**
 * Color tokens for the design system
 * Integrates colors from constants/items.ts and constants/theme.ts
 */

/**
 * Base color palette
 */
export const colors = {
  // Primary colors
  primary: '#3B82F6',
  secondary: '#6B7280',

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Classification colors (from constants/items.ts)
  classification: {
    corporateCard: '#10B981',  // 법인카드 - green
    personalCard: '#3B82F6',   // 개인카드 - blue
    proofDocument: '#8B5CF6',  // 증명 - purple
  },

  // Usage purpose colors (from constants/items.ts)
  usagePurpose: {
    meal: '#FF6B6B',   // 식대 - red
    other: '#C7CEEA',  // 기타 - lavender
  },

  // Light mode colors
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      muted: '#9CA3AF',
    },
  },

  // Dark mode colors
  dark: {
    background: '#111827',
    surface: '#1F2937',
    border: '#374151',
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      muted: '#9CA3AF',
    },
  },
} as const;

export type Colors = typeof colors;

/**
 * Helper type for color keys
 */
export type ColorKey = keyof typeof colors;

/**
 * Helper type for classification colors
 */
export type ClassificationColorKey = keyof typeof colors.classification;

/**
 * Helper type for usage purpose colors
 */
export type UsagePurposeColorKey = keyof typeof colors.usagePurpose;
