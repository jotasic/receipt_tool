/**
 * Calendar Screen
 *
 * Displays items in calendar view with two modes:
 * - Agenda mode: Daily view with expandable calendar
 * - Month mode: Monthly grid view with item previews
 */

import { useState, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Header, SegmentedControl } from '@/components/common';
import { AgendaCalendar } from '@/components/calendar/AgendaCalendar';
import { AgendaList } from '@/components/calendar/AgendaList';
import { MonthViewCalendar } from '@/components/calendar/MonthViewCalendar';
import { TabScreenContent } from '@/design-system/layouts';
import { useItemStore } from '@/store/itemStore';

type ViewMode = 'agenda' | 'month';

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const { items, loadItems } = useItemStore();

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

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

  // Get items for selected date
  const selectedDateItems = useMemo(() => {
    return items.filter((item) => item.date === selectedDate);
  }, [items, selectedDate]);

  // View mode change handler
  const handleViewModeChange = (index: number) => {
    setViewMode(index === 0 ? 'agenda' : 'month');
  };

  // Date press handler (switch from month to agenda mode)
  const handleDatePress = (date: string) => {
    setSelectedDate(date);
    setViewMode('agenda');
  };

  return (
    <>
      <Header
        title="달력"
        rightElement={
          <SegmentedControl
            values={['증빙', '월']}
            selectedIndex={viewMode === 'agenda' ? 0 : 1}
            onChange={handleViewModeChange}
          />
        }
      />
      <TabScreenContent>
        {viewMode === 'month' ? (
          <MonthViewCalendar items={items} onDatePress={handleDatePress} />
        ) : (
          <>
            <AgendaCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              markedDates={markedDates}
            />
            <AgendaList items={selectedDateItems} selectedDate={selectedDate} />
          </>
        )}
      </TabScreenContent>
    </>
  );
}
