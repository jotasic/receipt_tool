import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Item } from '@/types/item';
import { getClassificationConfig } from '@/constants/items';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';
import { ClassificationBadge, UsagePurposeBadge } from '@/components/common';

interface ItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
  showDate?: boolean;
}

export const ItemCard = React.memo(function ItemCard({ item, onPress, showDate = true }: ItemCardProps) {
  const classificationConfig = getClassificationConfig(item.classification);
  const defaultColor = useThemeColor(colors.light.text.secondary, colors.dark.text.secondary);
  const segments = useSegments();

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(item);
      return;
    }

    // Determine the current tab to navigate within the correct stack
    // segments[0] = '(tabs)', segments[1] = tab name (e.g. 'index', 'items', 'calendar')
    const currentTab = segments[1] ?? 'index';

    if (currentTab === 'items') {
      router.push(`/(tabs)/items/item/${item.id}`);
    } else if (currentTab === 'calendar') {
      router.push(`/(tabs)/calendar/item/${item.id}`);
    } else if (currentTab === 'reports') {
      router.push(`/(tabs)/reports/item/${item.id}`);
    } else {
      router.push(`/(tabs)/home/item/${item.id}`);
    }
  }, [onPress, item, segments]);

  // Format date for display (YYYY.MM.DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // Format amount with currency symbol
  const formatAmount = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`;
  };

  // Determine if we should show amount (hide for proof documents without amount)
  const shouldShowAmount = item.amount !== undefined && item.amount !== null;

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 border border-gray-100 dark:border-gray-700"
      style={({ pressed }) => [
        {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* Top Row: Icon, Title, Amount */}
      <View className="flex-row items-center">
        {/* Classification Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${classificationConfig?.color || defaultColor}15` }}
        >
          <Ionicons
            name={(classificationConfig?.icon || 'document') as React.ComponentProps<typeof Ionicons>['name']}
            size={20}
            color={classificationConfig?.color || defaultColor}
          />
        </View>

        {/* Title */}
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 dark:text-gray-100 text-base" numberOfLines={1}>
            {item.title}
          </Text>
        </View>

        {/* Amount */}
        {shouldShowAmount && item.amount !== undefined && item.amount !== null && (
          <Text className="font-bold text-gray-900 dark:text-gray-100 text-base ml-2">
            {formatAmount(item.amount)}
          </Text>
        )}
      </View>

      {/* Middle Row: Classification Badge, Usage Purpose Badge */}
      <View className="flex-row items-center mt-2 ml-13">
        <ClassificationBadge classification={item.classification} showIcon={false} />
        <Text className="text-gray-400 mx-2 text-xs">•</Text>
        <UsagePurposeBadge usagePurpose={item.usagePurpose} />
      </View>

      {/* Bottom Row: Date */}
      {showDate && (
        <View className="flex-row items-center mt-2 ml-13">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(item.date)}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

