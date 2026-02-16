/**
 * Calendar Theme Configuration
 *
 * react-native-calendars 라이브러리를 위한 테마 설정
 */

export const getCalendarTheme = (colorScheme: 'light' | 'dark') => ({
  // 배경색
  calendarBackground: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',

  // 텍스트 색상
  textSectionTitleColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
  dayTextColor: colorScheme === 'dark' ? '#F3F4F6' : '#111827',
  textDisabledColor: colorScheme === 'dark' ? '#4B5563' : '#D1D5DB',
  monthTextColor: colorScheme === 'dark' ? '#F3F4F6' : '#111827',

  // 선택된 날짜
  selectedDayBackgroundColor: '#3B82F6',
  selectedDayTextColor: '#FFFFFF',

  // 오늘 날짜
  todayTextColor: '#3B82F6',
  todayBackgroundColor: 'transparent',

  // 마커 (점)
  dotColor: '#3B82F6',
  selectedDotColor: '#FFFFFF',

  // 폰트
  textDayFontWeight: '400' as const,
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '600' as const,
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 14,

  // 화살표
  arrowColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',

  // Agenda 스타일
  agendaDayTextColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
  agendaDayNumColor: colorScheme === 'dark' ? '#F3F4F6' : '#111827',
  agendaTodayColor: '#3B82F6',
  agendaKnobColor: colorScheme === 'dark' ? '#4B5563' : '#D1D5DB',

  // 구분선
  'stylesheet.calendar.header': {
    week: {
      marginTop: 7,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
  },
});

/**
 * 한국어 로케일 설정
 */
export const koreanLocaleConfig = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  dayNames: [
    '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'
  ],
  dayNamesShort: [
    '일', '월', '화', '수', '목', '금', '토'
  ],
  today: '오늘',
};
