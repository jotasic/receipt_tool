/**
 * MonthViewCalendar Component
 *
 * 월 모드: 한 달 전체의 증빙 현황을 한눈에 보여주는 달력 컴포넌트.
 * 각 날짜 셀에 증빙 미리보기를 표시합니다.
 */

import React, { useMemo } from 'react';
import { View, useColorScheme } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import type { Item } from '@/types/item';
import { getCalendarTheme, koreanLocaleConfig } from '@/constants/calendarTheme';
import { DateCellWithItems } from './DateCellWithItems';

// 한국어 로케일 설정
LocaleConfig.locales['ko'] = koreanLocaleConfig;
LocaleConfig.defaultLocale = 'ko';

interface MonthViewCalendarProps {
  items: Item[];
  onDatePress: (date: string) => void;
  currentMonth?: string; // YYYY-MM (optional)
}

/**
 * MonthViewCalendar
 *
 * react-native-calendars의 Calendar 컴포넌트를 사용하여
 * 날짜 셀을 커스터마이징합니다.
 */
export function MonthViewCalendar({
  items,
  onDatePress,
  currentMonth,
}: MonthViewCalendarProps) {
  const colorScheme = useColorScheme();
  const theme = getCalendarTheme(colorScheme ?? 'light');

  // 날짜별로 항목 그룹화
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, Item[]> = {};
    items.forEach((item) => {
      if (!grouped[item.date]) {
        grouped[item.date] = [];
      }
      grouped[item.date].push(item);
    });
    return grouped;
  }, [items]);

  // 오늘 날짜
  const today = new Date().toISOString().split('T')[0];

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Calendar
        current={currentMonth}
        theme={theme}
        // 날짜 셀 커스터마이징
        dayComponent={({ date, state, marking }) => {
          if (!date) return null;

          const dateItems = itemsByDate[date.dateString] || [];

          return (
            <DateCellWithItems
              date={date}
              items={dateItems}
              onPress={() => onDatePress(date.dateString)}
              marking={marking}
              state={state}
            />
          );
        }}
        // 마킹 설정 (오늘 날짜 표시용)
        markedDates={{
          [today]: {
            marked: false,
            selected: false,
          },
        }}
        // 월 변경 콜백
        onMonthChange={(month) => {
          // 필요 시 월 변경 이벤트 처리
          console.log('Month changed:', month.dateString);
        }}
        // 기타 설정
        firstDay={0} // 일요일 시작
        enableSwipeMonths={true} // 좌우 스와이프로 월 이동
        hideExtraDays={false} // 이전/다음 달 날짜도 표시
        monthFormat="M월" // 월 형식
      />
    </View>
  );
}
