/**
 * useThemedStyles Hook
 *
 * Utility for creating StyleSheet objects that respond to color scheme changes
 *
 * @example
 * ```tsx
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *     borderColor: colors.border,
 *   },
 *   text: {
 *     color: colors.text,
 *   },
 * }));
 * ```
 */

import { StyleSheet, useColorScheme } from 'react-native';
import { useMemo } from 'react';

/**
 * Color palette for themed styles
 */
export interface ThemeColors {
  /** Current color scheme */
  scheme: 'light' | 'dark';

  /** Primary background color */
  background: string;

  /** Secondary background color (cards, elevated surfaces) */
  backgroundSecondary: string;

  /** Primary text color */
  text: string;

  /** Secondary text color (muted, descriptions) */
  textSecondary: string;

  /** Border color */
  border: string;

  /** Primary accent color */
  primary: string;

  /** Error/danger color */
  error: string;

  /** Success color */
  success: string;

  /** Warning color */
  warning: string;

  /** Info color */
  info: string;
}

/**
 * Default theme colors based on NativeWind/Tailwind palette
 */
const lightColors: ThemeColors = {
  scheme: 'light',
  background: '#FFFFFF',           // white
  backgroundSecondary: '#F9FAFB',  // gray-50
  text: '#111827',                 // gray-900
  textSecondary: '#6B7280',        // gray-500
  border: '#E5E7EB',               // gray-200
  primary: '#3B82F6',              // blue-500
  error: '#EF4444',                // red-500
  success: '#10B981',              // green-500
  warning: '#F59E0B',              // amber-500
  info: '#06B6D4',                 // cyan-500
};

const darkColors: ThemeColors = {
  scheme: 'dark',
  background: '#111827',           // gray-900
  backgroundSecondary: '#1F2937',  // gray-800
  text: '#F9FAFB',                 // gray-50
  textSecondary: '#9CA3AF',        // gray-400
  border: '#374151',               // gray-700
  primary: '#3B82F6',              // blue-500
  error: '#EF4444',                // red-500
  success: '#10B981',              // green-500
  warning: '#F59E0B',              // amber-500
  info: '#06B6D4',                 // cyan-500
};

/**
 * Creates a StyleSheet that responds to color scheme changes
 *
 * @param createStyles - Function that receives theme colors and returns style objects
 * @returns StyleSheet object with themed styles
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const styles = useThemedStyles((colors) => ({
 *     container: {
 *       backgroundColor: colors.background,
 *       padding: 16,
 *     },
 *     title: {
 *       color: colors.text,
 *       fontSize: 18,
 *       fontWeight: 'bold',
 *     },
 *     description: {
 *       color: colors.textSecondary,
 *       fontSize: 14,
 *     },
 *   }));
 *
 *   return (
 *     <View style={styles.container}>
 *       <Text style={styles.title}>Title</Text>
 *       <Text style={styles.description}>Description</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (colors: ThemeColors) => T
): T {
  const colorScheme = useColorScheme();

  const colors = useMemo(
    () => (colorScheme === 'dark' ? darkColors : lightColors),
    [colorScheme]
  );

  const styles = useMemo(
    () => StyleSheet.create(createStyles(colors)),
    [colors, createStyles]
  );

  return styles;
}

/**
 * Hook to get the current theme colors without creating styles
 *
 * @returns Current theme colors based on color scheme
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const colors = useThemeColors();
 *
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.text }}>Hello</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}
