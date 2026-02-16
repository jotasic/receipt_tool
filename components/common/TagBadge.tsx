import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Tag } from '@/types/tag';

interface TagBadgeProps {
  tag: Tag;
  variant?: 'default' | 'large';
  showIcon?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
}

/**
 * TagBadge Component
 *
 * Displays a tag badge with customizable appearance
 *
 * Usage:
 * - ItemDetail: Display selected tags
 * - ItemForm: Tag selection with remove button
 * - Items filter: Tag filter chips
 * - Tag management: Tag list items
 *
 * @param tag - The tag object with name and color
 * @param variant - Badge size variant (default | large)
 * @param showIcon - Whether to show the pricetag icon (default: false)
 * @param showRemove - Whether to show the remove button (default: false)
 * @param onRemove - Callback when remove button is pressed
 */
export function TagBadge({
  tag,
  variant = 'default',
  showIcon = false,
  showRemove = false,
  onRemove,
}: TagBadgeProps) {
  const isLarge = variant === 'large';
  const iconSize = isLarge ? 16 : 12;
  const textSize = isLarge ? 'text-base' : 'text-xs';
  const padding = isLarge ? 'px-4 py-2' : 'px-3 py-1';

  return (
    <View
      className={`${padding} rounded-full flex-row items-center`}
      style={{ backgroundColor: `${tag.color}20` }}
    >
      {showIcon && (
        <Ionicons
          name="pricetag"
          size={iconSize}
          color={tag.color}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        className={`${textSize} font-medium`}
        style={{ color: tag.color }}
      >
        {tag.name}
      </Text>
      {showRemove && onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          className="ml-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={iconSize}
            color={tag.color}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
