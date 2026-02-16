/**
 * MonthSelector Component
 *
 * A month selector component for filtering items by month
 * Includes navigation buttons and "All" option
 */

import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

interface MonthSelectorProps {
  selectedMonth: Date | null; // null = "All", Date = specific month
  onMonthChange: (month: Date | null) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const colorScheme = useColorScheme();
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());

  // Initialize from selectedMonth if provided
  useEffect(() => {
    if (selectedMonth) {
      setCurrentYear(selectedMonth.getFullYear());
      setCurrentMonth(selectedMonth.getMonth());
    }
  }, [selectedMonth]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }

    // Auto-select the new month when navigating
    const newDate = new Date(
      currentMonth === 0 ? currentYear - 1 : currentYear,
      currentMonth === 0 ? 11 : currentMonth - 1,
      1
    );
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }

    // Auto-select the new month when navigating
    const newDate = new Date(
      currentMonth === 11 ? currentYear + 1 : currentYear,
      currentMonth === 11 ? 0 : currentMonth + 1,
      1
    );
    onMonthChange(newDate);
  };

  const handleMonthSelect = () => {
    if (selectedMonth === null) {
      // If "All" is selected, switch to current month
      const newDate = new Date(currentYear, currentMonth, 1);
      onMonthChange(newDate);
    } else {
      // If a month is selected, switch to "All"
      onMonthChange(null);
    }
  };

  const isAllSelected = selectedMonth === null;

  // Get appropriate arrow color based on theme and state
  const getArrowColor = () => {
    if (isAllSelected) {
      return '#9CA3AF'; // gray-400 (disabled state)
    }
    return colorScheme === 'dark' ? '#D1D5DB' : '#374151'; // gray-300 (dark) / gray-700 (light)
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#6B7280"
            style={{ marginRight: 8 }}
          />
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            기간 선택
          </Text>
        </View>
      </View>

      {/* Month Navigator */}
      <View className="flex-row items-center justify-between">
        {/* Previous Month Button */}
        <TouchableOpacity
          onPress={goToPreviousMonth}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
          activeOpacity={0.7}
          accessibilityLabel="이전 월"
          accessibilityRole="button"
          disabled={isAllSelected}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={getArrowColor()}
          />
        </TouchableOpacity>

        {/* Month Display / Toggle Button */}
        <TouchableOpacity
          onPress={handleMonthSelect}
          className={`
            flex-1 mx-3 py-3 rounded-lg items-center justify-center
            ${isAllSelected
              ? 'bg-blue-600 dark:bg-blue-500'
              : 'bg-gray-100 dark:bg-gray-700'
            }
          `}
          activeOpacity={0.7}
          accessibilityLabel={isAllSelected ? "전체 기간" : `${currentYear}년 ${currentMonth + 1}월`}
          accessibilityRole="button"
          accessibilityState={{ selected: !isAllSelected }}
        >
          {isAllSelected ? (
            <View className="flex-row items-center">
              <Ionicons name="infinite" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text className="text-base font-bold text-white">
                전체
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {currentYear}년 {currentMonth + 1}월
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Next Month Button */}
        <TouchableOpacity
          onPress={goToNextMonth}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
          activeOpacity={0.7}
          accessibilityLabel="다음 월"
          accessibilityRole="button"
          disabled={isAllSelected}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={getArrowColor()}
          />
        </TouchableOpacity>
      </View>

      {/* Helper Text */}
      <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <Text className="text-xs text-center text-gray-500 dark:text-gray-400">
          {isAllSelected
            ? '모든 기간의 항목을 표시합니다'
            : `${currentYear}년 ${currentMonth + 1}월의 항목만 표시합니다`
          }
        </Text>
      </View>
    </View>
  );
}
