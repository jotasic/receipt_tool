/**
 * Calendar Screen
 *
 * Displays items (receipts/documents) in a calendar view
 * Uses the unified Item system
 */

import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, Card } from '@/components/common';
import { useItemStore } from '@/store/itemStore';
import { isExpense } from '@/types/item';
import type { Item, ItemClassification } from '@/types/item';

function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}

const CLASSIFICATION_ICONS: Record<ItemClassification, keyof typeof Ionicons.glyphMap> = {
  personal_card: 'card',
  corporate_card: 'business',
  proof_document: 'document-text',
};

const CLASSIFICATION_NAMES: Record<ItemClassification, string> = {
  personal_card: '개인',
  corporate_card: '법인',
  proof_document: '증명',
};

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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">달력</Text>
      </View>

      <ScrollView className="flex-1">
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
                <Text className="text-lg font-semibold text-gray-900">
                  {formatSelectedDate(selectedDate)}
                </Text>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-700 font-medium">
                    {selectedDateItems.length}건
                  </Text>
                </View>
              </View>

              {selectedDateItems.length > 0 ? (
                <>
                  <View className="border-t border-gray-100 pt-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-500">총 금액</Text>
                      <Text className="text-xl font-bold text-blue-600">
                        {formatCurrency(selectedDateTotal)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View className="items-center py-4">
                  <Text className="text-gray-500">이 날짜에 항목이 없습니다</Text>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Selected Date Items List */}
        {selectedDate && selectedDateItems.length > 0 && (
          <View className="px-4 pb-4">
            <Text className="text-lg font-semibold mb-3 text-gray-900">항목 목록</Text>
            {selectedDateItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/item/${item.id}`)}
                className="flex-row items-center bg-white p-4 rounded-lg mb-2"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                  <Ionicons
                    name={CLASSIFICATION_ICONS[item.classification]}
                    size={20}
                    color="#6B7280"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900" numberOfLines={1}>
                    {item.storeName || item.title}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View
                      className={`px-2 py-0.5 rounded ${
                        item.classification === 'corporate_card'
                          ? 'bg-blue-100'
                          : item.classification === 'personal_card'
                          ? 'bg-red-100'
                          : 'bg-purple-100'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          item.classification === 'corporate_card'
                            ? 'text-blue-700'
                            : item.classification === 'personal_card'
                            ? 'text-red-700'
                            : 'text-purple-700'
                        }`}
                      >
                        {CLASSIFICATION_NAMES[item.classification]}
                      </Text>
                    </View>
                  </View>
                </View>
                {item.amount !== undefined && item.amount !== null && (
                  <Text className="font-bold text-gray-900">
                    {formatCurrency(item.amount)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Monthly Summary (when no date selected) */}
        {!selectedDate && (
          <View className="px-4 pb-4">
            <Card>
              <Text className="text-lg font-semibold text-gray-900 mb-2">이번 달 요약</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500">총 항목</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {items.length}건
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-500">총 금액</Text>
                <Text className="text-xl font-bold text-blue-600">
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
    </SafeAreaView>
  );
}
