import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getClassificationConfig } from '@/constants/items';
import type { ItemClassification } from '@/types/item';

/**
 * Resolved display data for a classification.
 * Shared shape between legacy configs and DB-backed custom classifications.
 */
export interface ClassificationDisplayData {
  name: string;
  icon?: string | null;
  color?: string | null;
}

interface ClassificationBadgeProps {
  classification: ItemClassification;
  /** Optional resolved display data from the DB (custom classifications). When
   *  provided, takes precedence over the legacy `getClassificationConfig` lookup. */
  classificationData?: ClassificationDisplayData;
  variant?: 'default' | 'large';
  showIcon?: boolean;
}

/**
 * ClassificationBadge Component
 *
 * Displays a classification badge (법인카드, 개인카드, 증명서류) with icon and text.
 * Supports both legacy 3-value enum and DB-backed custom classifications via the
 * optional `classificationData` prop.
 *
 * Usage:
 * - ItemCard: Shows classification with icon
 * - ItemDetail: Large variant with icon
 * - Items filter: Default variant
 *
 * @param classification - The legacy classification type (used as fallback lookup key)
 * @param classificationData - Optional resolved display data for custom classifications
 * @param variant - Badge size variant (default | large)
 * @param showIcon - Whether to show the icon (default: true)
 */
export function ClassificationBadge({
  classification,
  classificationData,
  variant = 'default',
  showIcon = true,
}: ClassificationBadgeProps) {
  // Prefer the explicit classificationData prop; fall back to legacy config lookup.
  const legacyConfig = getClassificationConfig(classification);
  const resolvedName = classificationData?.name ?? legacyConfig?.name;
  const resolvedIcon = classificationData?.icon !== undefined
    ? classificationData.icon
    : legacyConfig?.icon;
  const resolvedColor = classificationData?.color !== undefined
    ? classificationData.color
    : legacyConfig?.color;

  if (!resolvedName) {
    return null;
  }

  // Build a unified config object so the rest of the render stays unchanged.
  const config = {
    name: resolvedName,
    icon: resolvedIcon ?? 'document',
    color: resolvedColor ?? '#6B7280',
  };

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
