/**
 * Spacing tokens for the design system
 * Based on constants/theme.ts spacing values
 */

/**
 * Spacing scale (in pixels)
 * Used for margins, paddings, gaps, etc.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

/**
 * Border radius scale (in pixels)
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;

/**
 * Helper type for spacing keys
 */
export type SpacingKey = keyof typeof spacing;

/**
 * Helper type for border radius keys
 */
export type BorderRadiusKey = keyof typeof borderRadius;
