import { useColorScheme } from 'react-native';
import { CalendarProvider, ExpandableCalendar, LocaleConfig } from 'react-native-calendars';
import { getCalendarTheme, koreanLocaleConfig } from '@/constants/calendarTheme';
import type { MarkedDates } from 'react-native-calendars/src/types';

// 한국어 로케일 설정
LocaleConfig.locales['kr'] = koreanLocaleConfig;
LocaleConfig.defaultLocale = 'kr';

interface AgendaCalendarProps {
  selectedDate: string;  // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  markedDates: { [date: string]: { marked: boolean } };
}

export function AgendaCalendar({ selectedDate, onDateSelect, markedDates }: AgendaCalendarProps) {
  const colorScheme = useColorScheme();
  const theme = getCalendarTheme(colorScheme || 'light');

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

  return (
    <CalendarProvider
      date={selectedDate}
      onDateChanged={onDateSelect}
    >
      <ExpandableCalendar
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
    </CalendarProvider>
  );
}
