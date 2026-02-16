import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ItemCard } from '@/components/item/ItemCard';
import { getClassificationConfig } from '@/constants/items';
import type { Item } from '@/types/item';
import {
  getMonthlyItems,
  calculateMonthlySummary,
} from '@/services/export';
import type { MonthlySummary } from '@/services/export/types';

function SummaryCard({ summary }: { summary: MonthlySummary }) {
  const corporateCardConfig = getClassificationConfig('corporate_card');
  const personalCardConfig = getClassificationConfig('personal_card');
  const proofDocumentConfig = getClassificationConfig('proof_document');

  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700">
      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        월별 요약
      </Text>

      {/* Corporate Card */}
      {corporateCardConfig && (
        <View className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: corporateCardConfig.color }} />
            <Text className="text-sm text-gray-700 dark:text-gray-300">{corporateCardConfig.name}</Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-bold text-gray-900 dark:text-gray-100">
              {summary.corporateCard.totalAmount.toLocaleString('ko-KR')}원
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {summary.corporateCard.count}건
            </Text>
          </View>
        </View>
      )}

      {/* Personal Card */}
      {personalCardConfig && (
        <View className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: personalCardConfig.color }} />
            <Text className="text-sm text-gray-700 dark:text-gray-300">{personalCardConfig.name}</Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-bold text-gray-900 dark:text-gray-100">
              {summary.personalCard.totalAmount.toLocaleString('ko-KR')}원
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {summary.personalCard.count}건
            </Text>
          </View>
        </View>
      )}

      {/* Proof Documents */}
      {proofDocumentConfig && (
        <View className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: proofDocumentConfig.color }} />
            <Text className="text-sm text-gray-700 dark:text-gray-300">{proofDocumentConfig.name}</Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-bold text-gray-900 dark:text-gray-100">
              {summary.proofDocument.totalAmount.toLocaleString('ko-KR')}원
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {summary.proofDocument.count}건
            </Text>
          </View>
        </View>
      )}

      {/* Total */}
      <View className="flex-row justify-between items-center pt-3 mt-1">
        <Text className="text-base font-bold text-gray-900 dark:text-gray-100">합계</Text>
        <View className="items-end">
          <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {summary.total.totalAmount.toLocaleString('ko-KR')}원
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            총 {summary.total.count}건
          </Text>
        </View>
      </View>
    </View>
  );
}

function EmptyState({ year, month }: { year: string; month: string }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text className="text-lg font-semibold mt-4 text-gray-900 dark:text-gray-100">
        {year}년 {month}월에 항목이 없습니다
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
        항목을 추가하면 여기에 표시됩니다
      </Text>
    </View>
  );
}

export default function MonthlyReportScreen() {
  const { year, month } = useLocalSearchParams<{ year: string; month: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMonthlyData = useCallback(async () => {
    if (!year || !month) return;

    setIsLoading(true);
    try {
      const monthlyItems = await getMonthlyItems(parseInt(year), parseInt(month));
      setItems(monthlyItems);

      const monthlySummary = calculateMonthlySummary(monthlyItems);
      setSummary(monthlySummary);
    } catch (error) {
      console.error('Failed to load monthly data:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        className="flex-1 bg-white dark:bg-gray-900"
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemCard item={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              {summary && <SummaryCard summary={summary} />}
              {items.length > 0 && (
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  항목 목록
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            !isLoading ? <EmptyState year={year} month={month} /> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadMonthlyData}
              tintColor="#3B82F6"
            />
          }
        />
    </>
  );
}
