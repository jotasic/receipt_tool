/**
 * DateCellWithItems Component
 *
 * 월 모드 달력의 날짜 셀 컴포넌트.
 * 날짜 숫자와 함께 해당 날짜의 증빙 미리보기를 표시합니다.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Item } from '@/types/item';

interface DateCellWithItemsProps {
  date: {
    dateString: string; // YYYY-MM-DD
    day: number;
    month: number;
    year: number;
  };
  items: Item[];
  onPress: () => void;
  marking?: any;
  state?: string;
}

/**
 * DateCellWithItems
 *
 * 날짜 셀에 증빙 미리보기를 표시하는 컴포넌트.
 * 최대 2개의 증빙 제목을 표시하고, 더 많으면 "외 N건" 추가.
 */
export function DateCellWithItems({
  date,
  items,
  onPress,
  marking,
  state,
}: DateCellWithItemsProps) {
  const isToday = state === 'today';
  const isDisabled = state === 'disabled';
  const hasItems = items.length > 0;

  // 최대 2개까지 표시
  const visibleItems = items.slice(0, 2);
  const remainingCount = items.length - visibleItems.length;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      className="flex-1 border-r border-b border-gray-200 dark:border-gray-700 p-2 min-h-[100px]"
    >
      {/* 날짜 숫자 */}
      <View className="flex-row justify-between items-start mb-1.5">
        <Text
          className={`text-base font-semibold ${
            isToday
              ? 'text-blue-500 dark:text-blue-400'
              : isDisabled
              ? 'text-gray-300 dark:text-gray-600'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {date.day}
        </Text>

        {/* 오늘 표시 */}
        {isToday && (
          <View className="bg-blue-500 dark:bg-blue-600 rounded-full w-2 h-2" />
        )}
      </View>

      {/* 증빙 미리보기 */}
      {hasItems && !isDisabled && (
        <View className="flex-1 gap-1">
          {visibleItems.map((item) => (
            <View
              key={item.id}
              className="bg-blue-50 dark:bg-blue-900/40 rounded-md px-1.5 py-1"
            >
              <Text
                className="text-xs text-gray-800 dark:text-gray-200"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
            </View>
          ))}

          {/* 남은 개수 표시 */}
          {remainingCount > 0 && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              외 {remainingCount}건
            </Text>
          )}
        </View>
      )}

      {/* 증빙 개수 배지 (증빙이 많을 때) */}
      {hasItems && items.length > 2 && !isDisabled && (
        <View className="absolute bottom-1.5 right-1.5 bg-blue-500 dark:bg-blue-600 rounded-full w-6 h-6 items-center justify-center">
          <Text className="text-xs text-white font-semibold">
            {items.length}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
