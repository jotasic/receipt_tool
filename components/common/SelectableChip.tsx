import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectableChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  variant?: 'filled' | 'outlined';
}

/**
 * SelectableChip Component
 *
 * A selectable chip/pill button used for filters and selections.
 *
 * Usage:
 * - Classification filter: variant="filled", icon provided
 * - Tag filter: variant="outlined", custom color
 * - General filter: variant="filled" (default)
 *
 * @param label - Text to display
 * @param isSelected - Whether the chip is selected
 * @param onPress - Callback when pressed
 * @param icon - Optional Ionicons icon name
 * @param color - Custom color (default: blue)
 * @param variant - 'filled' (solid bg when selected) or 'outlined' (border style)
 */
export function SelectableChip({
  label,
  isSelected,
  onPress,
  icon,
  color = '#3B82F6', // blue-600
  variant = 'filled',
}: SelectableChipProps) {
  const isOutlined = variant === 'outlined';

  // Filled variant styles
  const filledSelectedBg = color;
  const filledUnselectedBg = '#F3F4F6'; // gray-100
  const filledSelectedText = '#FFFFFF';
  const filledUnselectedText = '#374151'; // gray-700
  const filledSelectedIcon = '#FFFFFF';
  const filledUnselectedIcon = '#6B7280'; // gray-500

  // Outlined variant styles
  const outlinedSelectedBg = color;
  const outlinedUnselectedBg = 'transparent';
  const outlinedSelectedText = '#FFFFFF';
  const outlinedUnselectedText = color;
  const outlinedBorderColor = color;

  const backgroundColor = isOutlined
    ? isSelected ? outlinedSelectedBg : outlinedUnselectedBg
    : isSelected ? filledSelectedBg : filledUnselectedBg;

  const textColor = isOutlined
    ? isSelected ? outlinedSelectedText : outlinedUnselectedText
    : isSelected ? filledSelectedText : filledUnselectedText;

  const iconColor = isSelected ? filledSelectedIcon : filledUnselectedIcon;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-4 py-2 rounded-full flex-row items-center"
      style={{
        backgroundColor,
        borderWidth: isOutlined ? 1 : 0,
        borderColor: isOutlined ? outlinedBorderColor : undefined,
      }}
      activeOpacity={0.7}
      accessibilityLabel={`${label} 필터`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={iconColor}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        className="font-medium text-sm"
        style={{ color: textColor }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
