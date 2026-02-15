/**
 * Calendar Screen
 *
 * Displays receipts and documents in a calendar view
 */

import { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, Card } from '@/components/common';
import { useReceiptStore } from '@/store/receiptStore';
import type { Receipt } from '@/types';

function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}

export default function CalendarScreen() {
  const { receipts, loadReceipts } = useReceiptStore();
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadReceipts();
  }, []);

  // Group receipts by date and calculate totals for markers
  const markedDates = useMemo(() => {
    const marks: { [date: string]: { count: number; color?: string } } = {};

    receipts.forEach((receipt) => {
      const date = receipt.date;
      if (marks[date]) {
        marks[date].count += 1;
      } else {
        marks[date] = { count: 1, color: '#3B82F6' };
      }
    });

    return marks;
  }, [receipts]);

  // Get receipts for selected date
  const selectedDateReceipts = useMemo(() => {
    if (!selectedDate) return [];
    return receipts.filter((receipt) => receipt.date === selectedDate);
  }, [receipts, selectedDate]);

  // Calculate total for selected date
  const selectedDateTotal = useMemo(() => {
    return selectedDateReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  }, [selectedDateReceipts]);

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
                    {selectedDateReceipts.length}건
                  </Text>
                </View>
              </View>

              {selectedDateReceipts.length > 0 ? (
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
                  <Text className="text-gray-500">이 날짜에 영수증이 없습니다</Text>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Selected Date Receipts List */}
        {selectedDate && selectedDateReceipts.length > 0 && (
          <View className="px-4 pb-4">
            <Text className="text-lg font-semibold mb-3 text-gray-900">영수증 목록</Text>
            {selectedDateReceipts.map((receipt) => (
              <TouchableOpacity
                key={receipt.id}
                onPress={() => router.push(`/receipt/${receipt.id}`)}
                className="flex-row items-center bg-white p-4 rounded-lg mb-2"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                  <Ionicons
                    name={receipt.receiptType === 'corporate' ? 'business-outline' : 'person-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900" numberOfLines={1}>
                    {receipt.storeName || receipt.title}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View
                      className={`px-2 py-0.5 rounded ${
                        receipt.receiptType === 'corporate'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          receipt.receiptType === 'corporate'
                            ? 'text-blue-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {receipt.receiptType === 'corporate' ? '법인' : '개인'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text className="font-bold text-gray-900">
                  {formatCurrency(receipt.amount)}
                </Text>
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
                <Text className="text-gray-500">총 영수증</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {receipts.length}건
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-500">총 금액</Text>
                <Text className="text-xl font-bold text-blue-600">
                  {formatCurrency(receipts.reduce((sum, r) => sum + r.amount, 0))}
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
