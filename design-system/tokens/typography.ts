/**
 * Typography tokens for the design system
 * Based on constants/theme.ts fontSize values
 */

/**
 * Font size scale (in pixels)
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

/**
 * Font weight scale
 */
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

/**
 * Line height scale (multiplier)
 */
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Letter spacing scale (in pixels)
 */
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
} as const;

export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type LetterSpacing = typeof letterSpacing;

/**
 * Helper type for font size keys
 */
export type FontSizeKey = keyof typeof fontSize;

/**
 * Helper type for font weight keys
 */
export type FontWeightKey = keyof typeof fontWeight;

/**
 * Helper type for line height keys
 */
export type LineHeightKey = keyof typeof lineHeight;

/**
 * Helper type for letter spacing keys
 */
export type LetterSpacingKey = keyof typeof letterSpacing;
