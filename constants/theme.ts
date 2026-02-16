/**
 * @deprecated Use design-system/tokens instead
 * This file is kept for backward compatibility but will be removed in the future.
 *
 * Migration guide:
 * - import { theme } from '@/constants/theme'
 * + import { tokens } from '@/design-system/tokens'
 *
 * - theme.colors.primary
 * + tokens.colors.primary
 *
 * - theme.spacing.md
 * + tokens.spacing.md
 */

import { tokens } from '@/design-system/tokens';

export const theme = {
  colors: {
    primary: tokens.colors.primary,
    secondary: tokens.colors.secondary,
    success: tokens.colors.success,
    warning: tokens.colors.warning,
    error: tokens.colors.error,
    background: tokens.colors.light.background,
    surface: tokens.colors.light.surface,
    text: {
      primary: tokens.colors.light.text.primary,
      secondary: tokens.colors.light.text.secondary,
      muted: tokens.colors.light.text.muted,
    },
    border: tokens.colors.light.border,
  },
  spacing: {
    xs: tokens.spacing.xs,
    sm: tokens.spacing.sm,
    md: tokens.spacing.md,
    lg: tokens.spacing.lg,
    xl: tokens.spacing.xl,
  },
  borderRadius: {
    sm: tokens.borderRadius.sm,
    md: tokens.borderRadius.md,
    lg: tokens.borderRadius.lg,
    full: tokens.borderRadius.full,
  },
  fontSize: {
    xs: tokens.fontSize.xs,
    sm: tokens.fontSize.sm,
    md: tokens.fontSize.md,
    lg: tokens.fontSize.lg,
    xl: tokens.fontSize.xl,
    '2xl': tokens.fontSize['2xl'],
  },
};

export type Theme = typeof theme;
