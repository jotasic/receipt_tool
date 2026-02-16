/**
 * Color Picker Component
 *
 * A reusable component for selecting colors from a predefined palette
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';

// Predefined color palette (same as tags)
export const COLORS = [
  { name: 'Red', value: colors.error },
  { name: 'Amber', value: colors.warning },
  { name: 'Green', value: colors.success },
  { name: 'Blue', value: colors.primary },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: colors.secondary },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Cyan', value: '#06B6D4' },
];

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  label?: string;
}

export function ColorPicker({
  selectedColor,
  onColorSelect,
  label = '색상',
}: ColorPickerProps) {
  const borderColor = useThemeColor(colors.light.text.primary, colors.dark.text.primary);

  return (
    <View>
      <Text className="text-gray-700 text-base font-medium mb-2">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color.value}
            onPress={() => onColorSelect(color.value)}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{
              backgroundColor: color.value,
              borderWidth: selectedColor === color.value ? 3 : 0,
              borderColor: borderColor,
            }}
            activeOpacity={0.7}
          >
            {selectedColor === color.value && (
              <Ionicons name="checkmark" size={24} color={colors.light.surface} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
