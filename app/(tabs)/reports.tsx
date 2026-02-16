import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { MonthSelector } from '@/components/common/MonthSelector';
import { TabScreenLayout } from '@/design-system/layouts';
import { ItemCard } from '@/components/item/ItemCard';
import { getClassificationConfig } from '@/constants/items';
import type { Item } from '@/types/item';
import {
  getMonthlyItems,
  calculateMonthlySummary,
  exportMonthlySettlement,
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


function EmptyState({ selectedMonth }: { selectedMonth: Date | null }) {
  const monthText = selectedMonth
    ? `${selectedMonth.getFullYear()}년 ${selectedMonth.getMonth() + 1}월`
    : '전체 기간';

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text className="text-lg font-semibold mt-4 text-gray-900 dark:text-gray-100">
        {monthText}에 항목이 없습니다
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
        항목을 추가하면 여기에 표시됩니다
      </Text>
    </View>
  );
}

export default function SettlementScreen() {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadMonthlyData = useCallback(async () => {
    if (!selectedMonth) {
      setItems([]);
      setSummary(null);
      return;
    }

    setIsLoading(true);
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;

      const monthlyItems = await getMonthlyItems(year, month);
      setItems(monthlyItems);

      const monthlySummary = calculateMonthlySummary(monthlyItems);
      setSummary(monthlySummary);
    } catch (error) {
      console.error('Failed to load monthly data:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  const handleExport = async () => {
    if (!selectedMonth) {
      Alert.alert('알림', '월을 선택해주세요.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('알림', '내보낼 항목이 없습니다.');
      return;
    }

    setIsExporting(true);
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;

      const result = await exportMonthlySettlement(year, month);

      if (result.success && result.filePath) {
        // Share the ZIP file
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.filePath, {
            mimeType: 'application/zip',
            dialogTitle: '정산 파일 공유',
          });
        } else {
          Alert.alert('성공', '정산 파일이 생성되었습니다.');
        }
      } else {
        Alert.alert('오류', result.error || '파일 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('오류', '파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TabScreenLayout title="정산" scrollable={false}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemCard item={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              <MonthSelector
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
              {summary && <SummaryCard summary={summary} />}
              {items.length > 0 && (
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  항목 목록
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            !isLoading ? <EmptyState selectedMonth={selectedMonth} /> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadMonthlyData}
              tintColor="#3B82F6"
            />
          }
        />

        {/* Export Button (Fixed at bottom) */}
        {items.length > 0 && (
          <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <TouchableOpacity
              onPress={handleExport}
              disabled={isExporting}
              className={`
                flex-row items-center justify-center py-4 rounded-xl
                ${isExporting ? 'bg-gray-400' : 'bg-blue-600'}
              `}
              activeOpacity={0.7}
            >
              {isExporting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-base font-bold text-white">
                    CSV/이미지 내보내기
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TabScreenLayout>
    </>
  );
}
