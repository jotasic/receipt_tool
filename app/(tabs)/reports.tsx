import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenContent } from '@/design-system/layouts';
import {
  getMonthlyItems,
  calculateMonthlySummary,
} from '@/services/export';
import type { MonthlySummary } from '@/services/export/types';

interface MonthData {
  year: number;
  month: number;
  summary: MonthlySummary;
  isLoading: boolean;
}

function getRecentMonths(count: number = 6) {
  const months: { year: number; month: number }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
  }
  return months;
}

function MonthCard({ data }: { data: MonthData }) {
  const { year, month, summary, isLoading } = data;

  const handlePress = () => {
    router.push(`/report/monthly/${year}/${month}`);
  };

  if (isLoading) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-3 border border-gray-100 dark:border-gray-700">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  const hasItems = summary.total.count > 0;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!hasItems}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-700 ${
        !hasItems ? 'opacity-50' : ''
      }`}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {year}년 {month}월
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {hasItems ? `총 ${summary.total.count}건` : '항목 없음'}
          </Text>
        </View>
        {hasItems && (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </View>

      {hasItems && (
        <View className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ₩{summary.total.totalAmount.toLocaleString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ReportsScreen() {
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllMonths = async () => {
    const months = getRecentMonths(6);

    // Initialize with loading state
    setMonthsData(
      months.map(({ year, month }) => ({
        year,
        month,
        summary: {
          corporateCard: { totalAmount: 0, count: 0 },
          personalCard: { totalAmount: 0, count: 0 },
          proofDocument: { totalAmount: 0, count: 0 },
          total: { totalAmount: 0, count: 0 },
        },
        isLoading: true,
      }))
    );

    // Load each month's data
    const results = await Promise.all(
      months.map(async ({ year, month }) => {
        try {
          const items = await getMonthlyItems(year, month);
          const summary = calculateMonthlySummary(items);
          return { year, month, summary, isLoading: false };
        } catch (error) {
          console.error(`Failed to load ${year}-${month}:`, error);
          return {
            year,
            month,
            summary: {
              corporateCard: { totalAmount: 0, count: 0 },
              personalCard: { totalAmount: 0, count: 0 },
              proofDocument: { totalAmount: 0, count: 0 },
              total: { totalAmount: 0, count: 0 },
            },
            isLoading: false,
          };
        }
      })
    );

    setMonthsData(results);
  };

  useEffect(() => {
    loadAllMonths();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllMonths();
    setIsRefreshing(false);
  };

  return (
    <TabScreenContent>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        className="flex-1 bg-white dark:bg-gray-900"
          data={monthsData}
          keyExtractor={(item) => `${item.year}-${item.month}`}
          renderItem={({ item }) => <MonthCard data={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
          ListHeaderComponent={
            <View className="mb-4">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                최근 6개월 정산 내역
              </Text>
            </View>
          }
        />
    </TabScreenContent>
  );
}
