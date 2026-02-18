/**
 * DatePickerInput - Date selection component using native date picker
 *
 * Platform-specific implementation:
 * - Android: DateTimePickerAndroid.open() (imperative API)
 * - iOS: DateTimePicker component inside Modal (declarative)
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { getCalendarDateRange } from '@/constants/calendarRange';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';

interface DatePickerInputProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  error?: string;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  const { minDate, maxDate } = getCalendarDateRange();
  const iconColor = useThemeColor(colors.light.text.muted, colors.dark.text.muted);
  const hasValue = Boolean(value);

  const dateValue = value
    ? new Date(value + 'T00:00:00')
    : new Date();

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: 'date',
        minimumDate: new Date(minDate + 'T00:00:00'),
        maximumDate: new Date(maxDate + 'T00:00:00'),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            onChange(toDateString(selectedDate));
          }
        },
      });
    } else {
      setShowIOSPicker(true);
    }
  };

  return (
    <View className="mb-4">
      {label ? (
        <Text className="text-gray-700 dark:text-gray-200 text-base font-medium mb-2">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={openPicker}
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

      {/* iOS Picker Modal */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showIOSPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowIOSPicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/40"
            onPress={() => setShowIOSPicker(false)}
          />
          <SafeAreaView className="bg-white dark:bg-gray-900">
            {/* Modal header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <Pressable onPress={() => setShowIOSPicker(false)}>
                <Text className="text-base text-gray-500 dark:text-gray-400">
                  취소
                </Text>
              </Pressable>
              <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                날짜 선택
              </Text>
              <Pressable onPress={() => setShowIOSPicker(false)}>
                <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">
                  확인
                </Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={dateValue}
              mode="date"
              display="spinner"
              minimumDate={new Date(minDate + 'T00:00:00')}
              maximumDate={new Date(maxDate + 'T00:00:00')}
              locale="ko-KR"
              onChange={(_event, selectedDate) => {
                if (selectedDate) {
                  onChange(toDateString(selectedDate));
                }
              }}
              style={{ height: 200 }}
            />
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
}
