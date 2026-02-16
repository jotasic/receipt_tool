import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getClassificationConfig } from '@/constants/items';
import type { ItemClassification } from '@/types/item';

interface ClassificationBadgeProps {
  classification: ItemClassification;
  variant?: 'default' | 'large';
  showIcon?: boolean;
}

/**
 * ClassificationBadge Component
 *
 * Displays a classification badge (법인카드, 개인카드, 증명서류) with icon and text
 *
 * Usage:
 * - ItemCard: Shows classification with icon
 * - ItemDetail: Large variant with icon
 * - Items filter: Default variant
 *
 * @param classification - The classification type
 * @param variant - Badge size variant (default | large)
 * @param showIcon - Whether to show the icon (default: true)
 */
export function ClassificationBadge({
  classification,
  variant = 'default',
  showIcon = true,
}: ClassificationBadgeProps) {
  const config = getClassificationConfig(classification);

  if (!config) {
    return null;
  }

  const isLarge = variant === 'large';
  const iconSize = isLarge ? 24 : 16;
  const textSize = isLarge ? 'text-base' : 'text-xs';
  const padding = isLarge ? 'px-4 py-2' : 'px-2 py-1';

  return (
    <View
      className={`${padding} rounded-full ${showIcon ? 'flex-row items-center' : ''}`}
      style={{ backgroundColor: `${config.color}15` }}
    >
      {showIcon && (
        <Ionicons
          name={config.icon as keyof typeof Ionicons.glyphMap}
          size={iconSize}
          color={config.color}
          style={isLarge ? { marginRight: 8 } : undefined}
        />
      )}
      <Text
        className={`${textSize} font-medium ${showIcon && !isLarge ? 'ml-1' : ''}`}
        style={{ color: config.color }}
      >
        {config.name}
      </Text>
    </View>
  );
}
