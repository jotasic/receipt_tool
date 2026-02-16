/**
 * Design System Tokens
 *
 * This module exports all design tokens used throughout the application.
 * Tokens are based on values from constants/items.ts and constants/theme.ts.
 */

export * from './colors';
export * from './spacing';
export * from './typography';

import { colors } from './colors';
import { spacing, borderRadius } from './spacing';
import { fontSize, fontWeight, lineHeight, letterSpacing } from './typography';

/**
 * Complete design tokens object
 */
export const tokens = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} as const;

export type Tokens = typeof tokens;

/**
 * Default export for convenience
 */
export default tokens;
