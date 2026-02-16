/**
 * Icon Picker Component
 *
 * A reusable modal for selecting Ionicons
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system/tokens/colors';
import { FullScreenModal } from './FullScreenModal';

// Common icons for usage purposes and tags
const COMMON_ICONS = [
  'restaurant',
  'car',
  'bus',
  'train',
  'airplane',
  'shopping-bag',
  'cart',
  'gift',
  'home',
  'business',
  'medical',
  'fitness',
  'book',
  'school',
  'briefcase',
  'phone',
  'laptop',
  'camera',
  'game-controller',
  'film',
  'music',
  'heart',
  'star',
  'trophy',
  'pricetag',
  'bookmark',
  'folder',
  'document',
  'cash',
  'card',
  'wallet',
  'receipt',
  'pizza',
  'cafe',
  'beer',
  'wine',
  'fast-food',
  'ellipsis-horizontal',
  'construct',
  'hammer',
  'build',
  'cog',
  'settings',
  'pencil',
  'create',
  'color-palette',
  'people',
  'person',
  'shield',
  'lock-closed',
  'lock-open',
  'notifications',
  'mail',
  'chatbubble',
  'call',
  'location',
  'map',
  'compass',
  'globe',
  'cloud',
  'sunny',
  'moon',
  'flash',
  'flame',
  'water',
  'leaf',
  'rose',
  'flower',
  'paw',
  'bicycle',
  'boat',
  'rocket',
  'battery-full',
  'bulb',
  'calculator',
  'calendar',
  'time',
  'timer',
  'stopwatch',
  'hourglass',
  'alarm',
] as const;

interface IconPickerProps {
  visible: boolean;
  selectedIcon: string | null;
  onIconSelect: (icon: string) => void;
  onClose: () => void;
}

export function IconPicker({
  visible,
  selectedIcon,
  onIconSelect,
  onClose,
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter icons by search query
  const filteredIcons = searchQuery.trim()
    ? COMMON_ICONS.filter((icon) =>
        icon.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMMON_ICONS;

  const handleSelectIcon = (icon: string) => {
    onIconSelect(icon);
    onClose();
  };

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      title="아이콘 선택"
      scrollable={false}
    >
      <View className="flex-1">
        {/* Search bar */}
        <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color={colors.secondary} />
            <TextInput
              className="flex-1 ml-2 text-base text-gray-900 dark:text-gray-100"
              placeholder="아이콘 검색"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Icon grid */}
        <ScrollView className="flex-1 p-4">
          <View className="flex-row flex-wrap gap-3">
            {filteredIcons.map((icon) => (
              <TouchableOpacity
                key={icon}
                onPress={() => handleSelectIcon(icon)}
                className="w-16 h-16 items-center justify-center rounded-lg border-2"
                style={{
                  borderColor:
                    selectedIcon === icon ? colors.primary : colors.light.border,
                  backgroundColor:
                    selectedIcon === icon ? '#EFF6FF' : colors.light.background,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={icon as any}
                  size={28}
                  color={selectedIcon === icon ? colors.primary : colors.light.text.secondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {filteredIcons.length === 0 && (
            <View className="items-center justify-center py-12">
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text className="mt-4 text-gray-500 dark:text-gray-400">
                검색 결과가 없습니다
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Selected icon preview */}
        {selectedIcon && (
          <View className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">선택된 아이콘</Text>
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg items-center justify-center mr-3">
                <Ionicons name={selectedIcon as any} size={24} color={colors.primary} />
              </View>
              <Text className="text-base text-gray-900 dark:text-gray-100">{selectedIcon}</Text>
            </View>
          </View>
        )}
      </View>
    </FullScreenModal>
  );
}
