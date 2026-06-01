/**
 * Calendar Screen
 *
 * Displays items in calendar view with two modes:
 * - Agenda mode: Daily view with expandable calendar
 * - Month mode: Monthly grid view with item previews
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Header, SegmentedControl } from '@/components/common';
import type { ClassificationDisplayData } from '@/components/common';
import { AgendaCalendar } from '@/components/calendar/AgendaCalendar';
import { MonthViewCalendar, type MonthViewCalendarRef } from '@/components/calendar/MonthViewCalendar';
import { TabScreenContent } from '@/design-system/layouts';
import { useItemStore } from '@/store/itemStore';
import { useSpaceStore } from '@/store/spaceStore';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { getActiveClassificationsBySpace } from '@/services/database/classificationService';

type ViewMode = 'agenda' | 'month';

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // "YYYY-MM"
  );
  const focusKeyRef = useRef(0);
  const [focusKey, setFocusKey] = useState(0);
  const monthCalendarRef = useRef<MonthViewCalendarRef>(null);
  const { items, loadItemsIfStale, error } = useItemStore();
  const { currentSpace } = useSpaceStore();
  const [classificationMap, setClassificationMap] = useState<Record<string, ClassificationDisplayData>>({});
  const todayButtonColor = useThemeColor('#2563EB', '#60A5FA');
  const errorTextColor = useThemeColor('#EF4444', '#F87171');

  useFocusEffect(
    useCallback(() => {
      focusKeyRef.current += 1;
      setFocusKey(focusKeyRef.current);
      loadItemsIfStale(currentSpace?.id ?? null);
    }, [loadItemsIfStale, currentSpace?.id])
  );

  useEffect(() => {
    if (!currentSpace) return;
    getActiveClassificationsBySpace(currentSpace.id).then((list) => {
      const map: Record<string, ClassificationDisplayData> = {};
      list.forEach((c) => { map[c.id] = { name: c.name, icon: c.icon, color: c.color }; });
      setClassificationMap(map);
    }).catch(console.error);
  }, [currentSpace?.id]);

  // Create markers for dates with items (agenda mode)
  const markedDates = useMemo(() => {
    const marks: { [date: string]: { marked: boolean } } = {};
    items.forEach((item) => {
      if (item.date !== selectedDate) {
        // Hide marker on selected date
        marks[item.date] = { marked: true };
      }
    });
    return marks;
  }, [items, selectedDate]);

  // "YYYY-MM" → "YYYY년 M월" 변환
  const formatMonthTitle = (ym: string) => {
    const [year, month] = ym.split('-');
    return `${year}년 ${parseInt(month, 10)}월`;
  };

  // View mode change handler
  const handleViewModeChange = (index: number) => {
    setViewMode(index === 0 ? 'agenda' : 'month');
  };

  // Date press handler (switch from month to agenda mode)
  const handleDatePress = (date: string) => {
    setSelectedDate(date);
    setViewMode('agenda');
  };

  // 오늘로 이동
  const handleGoToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    if (viewMode === 'month') {
      monthCalendarRef.current?.scrollToToday();
    }
  };

  return (
    <>
      <Header
        title={viewMode === 'month' ? formatMonthTitle(currentVisibleMonth) : '달력'}
        showSpaceIcon
        rightElement={
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleGoToToday}
              className="px-3 py-1.5 rounded-full border"
              style={{ borderColor: todayButtonColor }}
            >
              <Text className="text-xs font-semibold" style={{ color: todayButtonColor }}>
                오늘
              </Text>
            </TouchableOpacity>
            <SegmentedControl
              values={['증빙', '월']}
              selectedIndex={viewMode === 'agenda' ? 0 : 1}
              onChange={handleViewModeChange}
            />
          </View>
        }
      />
      <TabScreenContent>
        {error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-base text-center" style={{ color: errorTextColor }}>
              데이터를 불러오지 못했습니다.
            </Text>
          </View>
        ) : viewMode === 'month' ? (
          <MonthViewCalendar
            ref={monthCalendarRef}
            items={items}
            onDatePress={handleDatePress}
            onCurrentMonthChange={setCurrentVisibleMonth}
          />
        ) : (
          <AgendaCalendar
            key={focusKey}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            markedDates={markedDates}
            items={items}
            classificationMap={classificationMap}
          />
        )}
      </TabScreenContent>
    </>
  );
}
