/**
 * MonthViewCalendar Component
 *
 * FlatList 기반 주(week) 단위 연속 스크롤 달력.
 * CalendarList와 달리 월 경계 없이 자연스럽게 연속됩니다.
 */

import React, { useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, ViewToken } from 'react-native';
import type { Item } from '@/types/item';
import { DateCellWithItems } from './DateCellWithItems';

const CELL_HEIGHT = 100; // 각 주 행의 높이
const PAST_MONTHS = 12;
const FUTURE_MONTHS = 12;

// 날짜 → 'YYYY-MM-DD' 문자열
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 해당 날짜가 속한 주의 일요일 반환
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// 전체 주 목록 생성 (오늘 기준 전후 N개월)
function generateWeeks(
  pastMonths: number,
  futureMonths: number
): { key: string; days: Date[] }[] {
  const today = new Date();

  // 범위 시작: pastMonths 전 달의 1일이 속한 주의 시작
  const rangeStartMonth = new Date(today.getFullYear(), today.getMonth() - pastMonths, 1);
  let weekStart = getStartOfWeek(rangeStartMonth);

  // 범위 끝: futureMonths 후 달의 마지막 날
  const rangeEnd = new Date(today.getFullYear(), today.getMonth() + futureMonths + 1, 0);
  rangeEnd.setHours(23, 59, 59, 999);

  const weeks: { key: string; days: Date[] }[] = [];

  while (weekStart <= rangeEnd) {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000));
    }
    weeks.push({ key: toDateString(days[0]), days });
    weekStart = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return weeks;
}

interface MonthViewCalendarProps {
  items: Item[];
  onDatePress: (date: string) => void;
  currentMonth?: string;
  onCurrentMonthChange?: (month: string) => void;
}

export function MonthViewCalendar({
  items,
  onDatePress,
  onCurrentMonthChange,
}: MonthViewCalendarProps) {
  const weeks = useMemo(() => generateWeeks(PAST_MONTHS, FUTURE_MONTHS), []);

  // 날짜별 아이템 그룹화
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, Item[]> = {};
    items.forEach((item) => {
      if (!grouped[item.date]) grouped[item.date] = [];
      grouped[item.date].push(item);
    });
    return grouped;
  }, [items]);

  const today = useMemo(() => toDateString(new Date()), []);

  // 오늘이 속한 주의 인덱스 (초기 스크롤 위치)
  const todayIndex = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const idx = weeks.findIndex((w) => {
      const first = new Date(w.days[0]);
      const last = new Date(w.days[6]);
      first.setHours(0, 0, 0, 0);
      last.setHours(23, 59, 59, 999);
      return todayDate >= first && todayDate <= last;
    });
    return idx >= 0 ? idx : 0;
  }, [weeks]);

  // 현재 보이는 달 감지 (수요일 기준으로 해당 주의 달 판단)
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && onCurrentMonthChange) {
        const firstItem = viewableItems[0].item as { key: string; days: Date[] };
        const middleDay = firstItem.days[3]; // 수요일 기준
        const year = middleDay.getFullYear();
        const month = String(middleDay.getMonth() + 1).padStart(2, '0');
        onCurrentMonthChange(`${year}-${month}`);
      }
    },
    [onCurrentMonthChange]
  );

  // 주 행 렌더
  const renderWeek = useCallback(
    ({ item }: { item: { key: string; days: Date[] } }) => (
      <View style={{ flexDirection: 'row', height: CELL_HEIGHT }}>
        {item.days.map((day) => {
          const dateStr = toDateString(day);
          return (
            <DateCellWithItems
              key={dateStr}
              date={{
                dateString: dateStr,
                day: day.getDate(),
                month: day.getMonth() + 1,
                year: day.getFullYear(),
              }}
              items={itemsByDate[dateStr] ?? []}
              onPress={() => onDatePress(dateStr)}
              isToday={dateStr === today}
            />
          );
        })}
      </View>
    ),
    [itemsByDate, onDatePress, today]
  );

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Sticky 요일 헤더 */}
      <View className="flex-row border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <View key={day} className="flex-1 items-center py-2">
            <Text
              className={`text-xs font-medium ${
                i === 0
                  ? 'text-red-500'
                  : i === 6
                  ? 'text-blue-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      <FlatList
        data={weeks}
        renderItem={renderWeek}
        keyExtractor={(item) => item.key}
        initialScrollIndex={todayIndex}
        getItemLayout={(_, index) => ({
          length: CELL_HEIGHT,
          offset: CELL_HEIGHT * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />
    </View>
  );
}
