/**
 * DateCellWithItems Component
 *
 * 월 모드 달력의 날짜 셀 컴포넌트 (FlatList 주 단위 방식).
 * 날짜 숫자와 함께 해당 날짜의 증빙을 분류별 색상 태그로 표시합니다.
 * 오늘 날짜는 Outlook 스타일의 파란 원으로 표시합니다.
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Item } from '@/types/item';
import { CLASSIFICATIONS } from '@/constants/items';

// classification id → color 맵
const CLASSIFICATION_COLOR: Record<string, string> = {};
CLASSIFICATIONS.forEach((c) => {
  CLASSIFICATION_COLOR[c.id] = c.color;
});

interface DateCellWithItemsProps {
  date: {
    dateString: string; // YYYY-MM-DD
    day: number;
    month: number;
    year: number;
  };
  items: Item[];
  onDatePress: (dateString: string) => void;
  isToday: boolean;
}

/**
 * DateCellWithItems
 *
 * 날짜 셀에 증빙 미리보기를 분류별 색상으로 표시하는 컴포넌트.
 * 최대 2개의 증빙을 표시하고, 더 많으면 "+N건" 추가.
 */
export const DateCellWithItems = React.memo(function DateCellWithItems({
  date,
  items,
  onDatePress,
  isToday,
}: DateCellWithItemsProps) {
  const hasItems = items.length > 0;

  // 최대 2개까지 표시
  const visibleItems = items.slice(0, 2);
  const remainingCount = items.length - visibleItems.length;

  const handlePress = useCallback(() => {
    onDatePress(date.dateString);
  }, [onDatePress, date.dateString]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="flex-1 border-r border-b border-gray-200 dark:border-gray-700 p-1"
    >
      {/* 날짜 숫자 */}
      <View className="items-start mb-0.5">
        {isToday ? (
          <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-xs font-bold text-white">{date.day}</Text>
          </View>
        ) : date.day === 1 ? (
          // 1일: "3월 1" 형태로 (Outlook 스타일, 흐린 색)
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">
            {date.month}월{'\n'}1
          </Text>
        ) : (
          <Text className="text-xs font-medium text-gray-900 dark:text-gray-100">
            {date.day}
          </Text>
        )}
      </View>

      {/* 증빙 미리보기 - 분류별 색상 */}
      {hasItems && (
        <View className="flex-1 gap-0.5">
          {visibleItems.map((item) => {
            const color = CLASSIFICATION_COLOR[item.classification] ?? '#6B7280';
            // hex alpha 33 ≈ 20% opacity 배경
            const bgColor = color + '33';
            return (
              <View
                key={item.id}
                className="rounded px-0.5 py-0.5"
                style={{ backgroundColor: bgColor }}
              >
                <Text
                  className="text-xs leading-tight"
                  style={{ color, fontSize: 9 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.title}
                </Text>
              </View>
            );
          })}
          {remainingCount > 0 && (
            <Text className="text-gray-400 dark:text-gray-500" style={{ fontSize: 9 }}>
              +{remainingCount}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});
