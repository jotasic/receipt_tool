import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import type { Tag } from '@/types';

export type DateFilterType = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'custom';

export interface DateFilter {
  type: DateFilterType;
  from?: Date;
  to?: Date;
}

export interface FilterState {
  dateFilter: DateFilter;
  selectedTags: string[];
}

interface ItemsFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
  tags: Tag[];
}

const DATE_FILTER_OPTIONS: Array<{ type: DateFilterType; label: string }> = [
  { type: 'all', label: '전체 기간' },
  { type: 'this_month', label: '이번 달' },
  { type: 'last_month', label: '지난 달' },
  { type: 'last_3_months', label: '최근 3개월' },
  { type: 'custom', label: '사용자 지정' },
];

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export function ItemsFilterSheet({
  visible,
  onClose,
  onApply,
  currentFilters,
  tags,
}: ItemsFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const iconColor = useThemeColor('#374151', '#D1D5DB');
  const radioActiveColor = useThemeColor('#3B82F6', '#60A5FA');
  const radioInactiveColor = useThemeColor('#D1D5DB', '#4B5563');
  const inputBorderColor = useThemeColor('#E5E7EB', '#374151');
  const inputBgColor = useThemeColor('#F9FAFB', '#1F2937');
  const inputTextColor = useThemeColor('#111827', '#F9FAFB');
  const inputPlaceholderColor = useThemeColor('#9CA3AF', '#6B7280');

  const [localDateFilter, setLocalDateFilter] = useState<DateFilter>(currentFilters.dateFilter);
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>(currentFilters.selectedTags);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Sync local state when sheet opens
  useEffect(() => {
    if (visible) {
      setLocalDateFilter(currentFilters.dateFilter);
      setLocalSelectedTags(currentFilters.selectedTags);
      if (currentFilters.dateFilter.type === 'custom') {
        setCustomFrom(
          currentFilters.dateFilter.from
            ? currentFilters.dateFilter.from.toISOString().slice(0, 10)
            : ''
        );
        setCustomTo(
          currentFilters.dateFilter.to
            ? currentFilters.dateFilter.to.toISOString().slice(0, 10)
            : ''
        );
      } else {
        setCustomFrom('');
        setCustomTo('');
      }
    }
  }, [visible, currentFilters]);

  const handleDateFilterSelect = (type: DateFilterType) => {
    setLocalDateFilter({ type });
    if (type !== 'custom') {
      setCustomFrom('');
      setCustomTo('');
    }
  };

  const toggleTag = (tagId: string) => {
    setLocalSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleReset = () => {
    setLocalDateFilter({ type: 'this_month' });
    setLocalSelectedTags([]);
    setCustomFrom('');
    setCustomTo('');
  };

  const handleApply = () => {
    let finalDateFilter: DateFilter = localDateFilter;

    if (localDateFilter.type === 'custom') {
      const fromValid = isValidDateString(customFrom);
      const toValid = isValidDateString(customTo);
      finalDateFilter = {
        type: 'custom',
        from: fromValid ? new Date(customFrom) : undefined,
        to: toValid ? new Date(customTo) : undefined,
      };
    }

    onApply({ dateFilter: finalDateFilter, selectedTags: localSelectedTags });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        {/* Bottom Sheet */}
        <Pressable
          className="absolute bottom-0 left-0 right-0"
          onPress={(e) => e.stopPropagation()}
        >
          <View
            className="bg-white dark:bg-gray-800 rounded-t-3xl"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {/* Handle bar */}
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                필터
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 items-center justify-center"
                accessibilityLabel="닫기"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={22} color={iconColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="max-h-96"
            >
              {/* Date Filter Section */}
              <View className="px-6 py-4">
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  기간
                </Text>
                {DATE_FILTER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    onPress={() => handleDateFilterSelect(option.type)}
                    className="flex-row items-center py-3"
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: localDateFilter.type === option.type }}
                  >
                    {/* Radio button */}
                    <View
                      className="w-5 h-5 rounded-full border-2 items-center justify-center mr-3"
                      style={{
                        borderColor:
                          localDateFilter.type === option.type
                            ? radioActiveColor
                            : radioInactiveColor,
                      }}
                    >
                      {localDateFilter.type === option.type && (
                        <View
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: radioActiveColor }}
                        />
                      )}
                    </View>
                    <Text
                      className="text-base text-gray-900 dark:text-gray-100"
                      style={{
                        fontWeight:
                          localDateFilter.type === option.type ? '600' : '400',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Custom date inputs */}
                {localDateFilter.type === 'custom' && (
                  <View className="ml-8 mt-1 mb-2 gap-3">
                    <View>
                      <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        시작일
                      </Text>
                      <TextInput
                        value={customFrom}
                        onChangeText={setCustomFrom}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={inputPlaceholderColor}
                        keyboardType="numbers-and-punctuation"
                        maxLength={10}
                        style={{
                          borderWidth: 1,
                          borderColor: inputBorderColor,
                          backgroundColor: inputBgColor,
                          color: inputTextColor,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          fontSize: 14,
                        }}
                        accessibilityLabel="시작일 입력"
                      />
                    </View>
                    <View>
                      <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        종료일
                      </Text>
                      <TextInput
                        value={customTo}
                        onChangeText={setCustomTo}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={inputPlaceholderColor}
                        keyboardType="numbers-and-punctuation"
                        maxLength={10}
                        style={{
                          borderWidth: 1,
                          borderColor: inputBorderColor,
                          backgroundColor: inputBgColor,
                          color: inputTextColor,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          fontSize: 14,
                        }}
                        accessibilityLabel="종료일 입력"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Tag Filter Section */}
              {tags.length > 0 && (
                <View className="px-6 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 mt-4">
                    태그
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {/* All tags option */}
                    <TouchableOpacity
                      onPress={() => setLocalSelectedTags([])}
                      className="px-3 py-1.5 rounded-full border"
                      style={{
                        backgroundColor:
                          localSelectedTags.length === 0 ? radioActiveColor : 'transparent',
                        borderColor:
                          localSelectedTags.length === 0 ? radioActiveColor : radioInactiveColor,
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: localSelectedTags.length === 0 }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{
                          color: localSelectedTags.length === 0 ? '#FFFFFF' : inputTextColor,
                        }}
                      >
                        전체
                      </Text>
                    </TouchableOpacity>

                    {tags.map((tag) => {
                      const isSelected = localSelectedTags.includes(tag.id);
                      const tagColor = tag.color ?? radioActiveColor;
                      return (
                        <TouchableOpacity
                          key={tag.id}
                          onPress={() => toggleTag(tag.id)}
                          className="px-3 py-1.5 rounded-full border"
                          style={{
                            backgroundColor: isSelected ? tagColor : 'transparent',
                            borderColor: isSelected ? tagColor : radioInactiveColor,
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            className="text-sm font-medium"
                            style={{ color: isSelected ? '#FFFFFF' : inputTextColor }}
                          >
                            #{tag.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom Buttons */}
            <View className="flex-row px-6 pt-4 gap-3 border-t border-gray-100 dark:border-gray-700">
              <TouchableOpacity
                onPress={handleReset}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 items-center"
                activeOpacity={0.7}
                accessibilityLabel="필터 초기화"
                accessibilityRole="button"
              >
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  초기화
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApply}
                className="flex-[2] py-3 rounded-xl bg-blue-500 dark:bg-blue-600 items-center"
                activeOpacity={0.7}
                accessibilityLabel="필터 적용"
                accessibilityRole="button"
              >
                <Text className="text-sm font-semibold text-white">적용</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
