/**
 * Calendar Screen
 *
 * Displays items (receipts/documents) in a calendar view
 * Uses the unified Item system
 */

import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Calendar, Card } from '@/components/common';
import { ItemCard } from '@/components/item/ItemCard';
import { useItemStore } from '@/store/itemStore';
import { isExpense } from '@/types/item';

function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}

export default function CalendarScreen() {
  const { items, loadItems } = useItemStore();
  const [selectedDate, setSelectedDate] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  // Group items by date and calculate totals for markers
  const markedDates = useMemo(() => {
    const marks: { [date: string]: { count: number; color?: string } } = {};

    items.forEach((item) => {
      const date = item.date;
      if (marks[date]) {
        marks[date].count += 1;
      } else {
        marks[date] = { count: 1, color: '#3B82F6' };
      }
    });

    return marks;
  }, [items]);

  // Get items for selected date
  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];
    return items.filter((item) => item.date === selectedDate);
  }, [items, selectedDate]);

  // Calculate total for selected date (only expense items with amount)
  const selectedDateTotal = useMemo(() => {
    return selectedDateItems.reduce((sum, item) => {
      if (isExpense(item) && item.amount !== undefined && item.amount !== null) {
        return sum + item.amount;
      }
      return sum;
    }, 0);
  }, [selectedDateItems]);

  // Format selected date for display
  const formatSelectedDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  };

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
        {/* Calendar */}
        <View className="p-4">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            markedDates={markedDates}
          />
        </View>

        {/* Selected Date Summary */}
        {selectedDate && (
          <View className="px-4 pb-4">
            <Card>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatSelectedDate(selectedDate)}
                </Text>
                <View className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  <Text className="text-blue-700 dark:text-blue-400 font-medium">
                    {selectedDateItems.length}건
                  </Text>
                </View>
              </View>

              {selectedDateItems.length > 0 ? (
                <>
                  <View className="border-t border-gray-100 dark:border-gray-700 pt-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-500 dark:text-gray-400">총 금액</Text>
                      <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(selectedDateTotal)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View className="items-center py-4">
                  <Text className="text-gray-500 dark:text-gray-400">이 날짜에 항목이 없습니다</Text>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Selected Date Items List */}
        {selectedDate && selectedDateItems.length > 0 && (
          <View className="px-4 pb-4">
            <Text className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">항목 목록</Text>
            {selectedDateItems.map((item) => (
              <ItemCard key={item.id} item={item} showDate={false} />
            ))}
          </View>
        )}

        {/* Monthly Summary (when no date selected) */}
        {!selectedDate && (
          <View className="px-4 pb-4">
            <Card>
              <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">이번 달 요약</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500 dark:text-gray-400">총 항목</Text>
                <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {items.length}건
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-500 dark:text-gray-400">총 금액</Text>
                <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(
                    items.reduce((sum, item) => {
                      if (isExpense(item) && item.amount !== undefined && item.amount !== null) {
                        return sum + item.amount;
                      }
                      return sum;
                    }, 0)
                  )}
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
  );
}
