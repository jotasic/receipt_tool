/**
 * Calendar Component
 *
 * A simple calendar component for selecting and viewing dates
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useColorScheme } from '@/components/useColorScheme';

interface CalendarProps {
  selectedDate?: string;  // YYYY-MM-DD format
  onDateSelect?: (date: string) => void;
  markedDates?: { [date: string]: { count: number; color?: string } };
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function Calendar({ selectedDate, onDateSelect, markedDates = {} }: CalendarProps) {
  const colorScheme = useColorScheme();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(
    selectedDate ? parseInt(selectedDate.split('-')[0]) : today.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? parseInt(selectedDate.split('-')[1]) - 1 : today.getMonth()
  );

  const calendarData = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentYear, currentMonth]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleDateSelect = (day: number) => {
    const dateString = formatDate(currentYear, currentMonth, day);
    onDateSelect?.(dateString);
  };

  const isToday = (day: number) => {
    return (
      currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return formatDate(currentYear, currentMonth, day) === selectedDate;
  };

  const getMarkerData = (day: number) => {
    const dateString = formatDate(currentYear, currentMonth, day);
    return markedDates[dateString];
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={goToPreviousMonth} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} className="flex-row items-center">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {currentYear}년 {currentMonth + 1}월
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextMonth} className="p-2">
          <Ionicons name="chevron-forward" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View className="flex-row mb-2">
        {WEEKDAYS.map((day, index) => (
          <View key={day} className="flex-1 items-center py-2">
            <Text
              className={`text-sm font-medium ${
                index === 0 ? 'text-red-500 dark:text-red-400' : index === 6 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {calendarData.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} className="w-[14.28%] aspect-square" />;
          }

          const marker = getMarkerData(day);
          const dayOfWeek = (getFirstDayOfMonth(currentYear, currentMonth) + day - 1) % 7;
          const selected = isSelected(day);
          const isDarkMode = colorScheme === 'dark';

          // Dot indicator color based on selection and dark mode
          const dotColor = selected
            ? '#FFFFFF' // White dot on selected (blue background)
            : isDarkMode
            ? '#60A5FA' // Lighter blue for dark mode
            : '#3B82F6'; // Default blue for light mode

          return (
            <TouchableOpacity
              key={day}
              onPress={() => handleDateSelect(day)}
              className="w-[14.28%] aspect-square relative"
            >
              {/* Background circle for selected date */}
              {selected && (
                <View className="absolute inset-0 items-center justify-center">
                  <View className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full" />
                </View>
              )}

              {/* Border for today (if not selected) */}
              {isToday(day) && !selected && (
                <View className="absolute inset-0 items-center justify-center">
                  <View className="w-10 h-10 border border-blue-500 dark:border-blue-400 rounded-full" />
                </View>
              )}

              {/* Date number - centered independently */}
              <View className="flex-1 items-center justify-center">
                <Text
                  className={`text-base ${
                    selected
                      ? 'text-white font-bold'
                      : isToday(day)
                      ? 'text-blue-500 dark:text-blue-400 font-bold'
                      : dayOfWeek === 0
                      ? 'text-red-500 dark:text-red-400'
                      : dayOfWeek === 6
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {day}
                </Text>
              </View>

              {/* Dot indicator for marked dates */}
              {marker && (
                <View
                  className="absolute bottom-1 self-center w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: marker.color || dotColor,
                    zIndex: 10
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
