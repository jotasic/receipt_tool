/**
 * MonthViewCalendar Component
 *
 * 월 모드: Outlook 스타일의 수직 연속 스크롤 달력.
 * CalendarList를 사용하여 위아래 드래그로 월 이동이 가능하고,
 * 이번달과 다음달 일부가 동시에 화면에 보입니다.
 */

import React, { useMemo } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
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
  onCurrentMonthChange?: (month: string) => void; // 스크롤 시 현재 보이는 달 전달 ("YYYY-MM")
}

/**
 * MonthViewCalendar
 *
 * react-native-calendars의 CalendarList 컴포넌트를 사용하여
 * 수직 연속 스크롤 방식으로 월 이동을 지원합니다.
 * 상단에 요일 헤더가 sticky로 고정됩니다.
 * 월 섹션 헤더는 제거하고, 각 달 1일 셀에 "M월 1" 형태로 표시합니다.
 */
export function MonthViewCalendar({
  items,
  onDatePress,
  currentMonth,
  onCurrentMonthChange,
}: MonthViewCalendarProps) {
  const colorScheme = useColorScheme();
  const theme = getCalendarTheme(colorScheme ?? 'light');
  const isDark = colorScheme === 'dark';

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

      <CalendarList
        // 현재 날짜 기준 전후 12개월
        pastScrollRange={12}
        futureScrollRange={12}
        // 수직 스크롤
        horizontal={false}
        // 스크롤 스냅 비활성화 (자연스러운 연속 스크롤)
        pagingEnabled={false}
        // 섹션 헤더 완전 제거: 빈 View 반환
        renderHeader={() => <View />}
        // 요일 헤더 숨김 (위에서 sticky로 직접 렌더링)
        hideDayNames={true}
        // 테마 (stylesheet 오버라이드는 타입 캐스트 필요)
        theme={
          {
            ...theme,
            calendarBackground: isDark ? '#111827' : '#FFFFFF',
            'stylesheet.calendar.header': {
              week: { display: 'none' },
            },
          } as object
        }
        // 날짜 셀 커스터마이징
        dayComponent={({ date, state }) => {
          if (!date) return null;
          const dateItems = itemsByDate[date.dateString] || [];
          return (
            <DateCellWithItems
              date={date}
              items={dateItems}
              onPress={() => onDatePress(date.dateString)}
              state={state}
            />
          );
        }}
        // 오늘 날짜 마킹
        markedDates={{
          [today]: { marked: false, selected: false },
        }}
        // 시작 요일: 일요일
        firstDay={0}
        // 이전/다음 달 날짜 표시
        hideExtraDays={false}
        // 월 형식
        monthFormat="M월"
        // 현재 월로 스크롤
        current={currentMonth || today}
        showScrollIndicator={false}
        // 현재 보이는 달 변경 감지
        onVisibleMonthsChange={(months) => {
          if (months.length > 0 && onCurrentMonthChange) {
            const first = months[0];
            onCurrentMonthChange(
              `${first.year}-${String(first.month).padStart(2, '0')}`
            );
          }
        }}
      />
    </View>
  );
}
