/**
 * useThemeColor Hook
 *
 * Automatically selects the appropriate color based on the current color scheme (light/dark)
 *
 * @example
 * ```tsx
 * const textColor = useThemeColor('#000000', '#FFFFFF');
 * const bgColor = useThemeColor('#FFFFFF', '#1F2937');
 * ```
 */

import { useColorScheme } from 'react-native';

/**
 * Returns the appropriate color based on the current color scheme
 *
 * @param light - Color for light mode
 * @param dark - Color for dark mode
 * @returns The selected color based on the current color scheme
 */
export function useThemeColor(light: string, dark: string): string {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? dark : light;
}
