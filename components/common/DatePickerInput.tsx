/**
 * DatePickerInput - Date selection component using react-native-calendars
 *
 * Pure JS implementation (no native modules) - works with Expo Go.
 * Shows a pressable with the formatted date; on press opens a Modal
 * with a Calendar for date selection.
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  useColorScheme,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCalendarTheme } from '@/constants/calendarTheme';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';

interface DatePickerInputProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  error?: string;
}

function formatDisplayDate(value: string): string {
  if (!value) return '날짜 선택';
  const date = new Date(value + 'T00:00:00');
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DatePickerInput({
  label,
  value,
  onChange,
  error,
}: DatePickerInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const theme = useMemo(() => getCalendarTheme(colorScheme || 'light'), [colorScheme]);
  const iconColor = useThemeColor(colors.light.text.muted, colors.dark.text.muted);
  const hasValue = Boolean(value);

  const markedDates = value
    ? {
        [value]: {
          selected: true,
          selectedColor: '#3B82F6',
        },
      }
    : {};

  const handleDayPress = (day: { dateString: string }) => {
    onChange(day.dateString);
    setShowPicker(false);
  };

  return (
    <View className="mb-4">
      {label ? (
        <Text className="text-gray-700 dark:text-gray-200 text-base font-medium mb-2">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setShowPicker(true)}
        className={`
          flex-row items-center border rounded-lg px-4 py-3
          ${error
            ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }
        `}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={error ? '#EF4444' : iconColor}
        />
        <Text
          className={`ml-3 text-base flex-1 ${
            hasValue
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {formatDisplayDate(value)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={iconColor} />
      </Pressable>

      {error ? (
        <Text className="text-red-600 text-sm mt-1">{error}</Text>
      ) : null}

      {/* Date Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowPicker(false)}
        />
        <View
          className="bg-white dark:bg-gray-900"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {/* Modal header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Pressable onPress={() => setShowPicker(false)}>
              <Text className="text-base text-gray-500 dark:text-gray-400">취소</Text>
            </Pressable>
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              날짜 선택
            </Text>
            <Pressable onPress={() => setShowPicker(false)}>
              <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">
                확인
              </Text>
            </Pressable>
          </View>

          {/* Calendar */}
          <Calendar
            current={value || undefined}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={theme}
            firstDay={0}
          />
        </View>
      </Modal>
    </View>
  );
}
