import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUsagePurposeConfig } from '@/constants/items';
import type { UsagePurpose } from '@/types/item';

interface UsagePurposeBadgeProps {
  usagePurpose: UsagePurpose;
  variant?: 'default' | 'large';
  showIcon?: boolean;
}

/**
 * UsagePurposeBadge Component
 *
 * Displays a usage purpose badge (식비, 교통비, 숙박비, 기타) with icon and text
 *
 * Usage:
 * - ItemCard: Small badge with icon
 * - ItemDetail: Large variant with icon
 * - ItemForm: Selection display
 *
 * @param usagePurpose - The usage purpose type
 * @param variant - Badge size variant (default | large)
 * @param showIcon - Whether to show the icon (default: true)
 */
export function UsagePurposeBadge({
  usagePurpose,
  variant = 'default',
  showIcon = true,
}: UsagePurposeBadgeProps) {
  const config = getUsagePurposeConfig(usagePurpose);

  if (!config) {
    return null;
  }

  const isLarge = variant === 'large';
  const iconSize = isLarge ? 20 : 12;
  const textSize = isLarge ? 'text-base' : 'text-xs';
  const padding = isLarge ? 'px-4 py-2' : 'px-2 py-1';
  const iconMargin = isLarge ? 8 : 4;

  return (
    <View
      className={`${padding} rounded-full flex-row items-center`}
      style={{ backgroundColor: `${config.color}15` }}
    >
      {showIcon && (
        <Ionicons
          name={config.icon as keyof typeof Ionicons.glyphMap}
          size={iconSize}
          color={config.color}
          style={{ marginRight: iconMargin }}
        />
      )}
      <Text
        className={`${textSize} font-medium`}
        style={{ color: config.color }}
      >
        {config.name}
      </Text>
    </View>
  );
}
