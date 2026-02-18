import { useMemo, useCallback } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { CalendarProvider, ExpandableCalendar, AgendaList, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { getCalendarTheme, koreanLocaleConfig } from '@/constants/calendarTheme';
import { ItemCard } from '@/components/item/ItemCard';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';
import type { MarkedDates } from 'react-native-calendars/src/types';
import type { Item } from '@/types/item';

// 한국어 로케일 설정
LocaleConfig.locales['kr'] = koreanLocaleConfig;
LocaleConfig.defaultLocale = 'kr';

interface AgendaCalendarProps {
  selectedDate: string;  // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  markedDates: { [date: string]: { marked: boolean } };
  items: Item[];  // 전체 items
}

interface Section {
  title: string;  // YYYY-MM-DD
  data: Item[];
}

export function AgendaCalendar({ selectedDate, onDateSelect, markedDates, items }: AgendaCalendarProps) {
  const colorScheme = useColorScheme();
  const theme = getCalendarTheme(colorScheme || 'light');
  const iconColor = useThemeColor(colors.light.text.muted, colors.dark.text.muted);

  // Merge markedDates with selected date
  // Hide marker on selected date
  const finalMarkedDates: MarkedDates = {
    ...Object.keys(markedDates).reduce((acc, date) => {
      acc[date] = {
        marked: date !== selectedDate,
        selected: date === selectedDate,
        selectedColor: theme.selectedDayBackgroundColor,
      };
      return acc;
    }, {} as MarkedDates),
    [selectedDate]: {
      marked: false,
      selected: true,
      selectedColor: theme.selectedDayBackgroundColor,
    },
  };

  // Convert items to section format
  const sections = useMemo(() => {
    if (items.length === 0) {
      // No items at all - return empty array
      // AgendaList will show nothing, we'll handle this with conditional rendering
      return [];
    }

    // Group items by date
    const itemsByDate = items.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(item);
      return acc;
    }, {} as Record<string, Item[]>);

    // Convert to section array and sort by date (newest first)
    return Object.keys(itemsByDate)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: date,
        data: itemsByDate[date],
      }));
  }, [items]);

  // Render item
  const renderItem = useCallback(({ item }: { item: Item }) => {
    return <ItemCard item={item} showDate={false} />;
  }, []);

  // Render empty section (for dates with no items)
  const renderEmptyDate = () => {
    return (
      <View className="items-center justify-center py-12 px-4">
        <Ionicons name="receipt-outline" size={64} color={iconColor} />
        <Text className="text-gray-500 dark:text-gray-400 mt-4 text-base">
          이 날짜에 등록된 증빙이 없습니다
        </Text>
      </View>
    );
  };

  // Render empty entire list (when no data at all)
  const renderEmptyData = () => {
    return (
      <View className="flex-1 items-center justify-center py-20 px-4">
        <Ionicons name="calendar-outline" size={80} color={iconColor} />
        <Text className="text-gray-500 dark:text-gray-400 mt-6 text-lg font-medium">
          등록된 증빙이 없습니다
        </Text>
        <Text className="text-gray-400 dark:text-gray-500 mt-2 text-sm text-center">
          증빙 탭에서 증빙을 등록해보세요
        </Text>
      </View>
    );
  };

  return (
    <CalendarProvider
      date={selectedDate}
      onDateChanged={onDateSelect}
    >
      <ExpandableCalendar
        initialPosition={ExpandableCalendar.positions.CLOSED}
        theme={theme}
        firstDay={0} // 일요일 시작
        markedDates={finalMarkedDates}
        onDayPress={(day) => onDateSelect(day.dateString)}
        // 요일 색상 커스터마이징
        dayComponent={undefined} // 기본 컴포넌트 사용
        // 주말 색상 설정을 위한 추가 테마
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
        }}
      />
      {sections.length === 0 ? (
        renderEmptyData()
      ) : (
        <AgendaList
          sections={sections}
          renderItem={renderItem}
          dayFormat="M월 d일 EEEE"
          sectionStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#F9FAFB',
          }}
          theme={{
            ...theme,
            agendaDayTextColor: colorScheme === 'dark' ? '#F3F4F6' : '#111827',
            agendaDayNumColor: colorScheme === 'dark' ? '#F3F4F6' : '#111827',
            agendaTodayColor: theme.todayTextColor,
          }}
          markToday={true}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB',
          }}
        />
      )}
    </CalendarProvider>
  );
}
