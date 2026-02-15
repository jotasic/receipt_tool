/**
 * Report Edit Screen
 *
 * Screen for editing existing reports.
 * Allows updating title and managing included items (add/remove).
 *
 * Features:
 * - Load existing report data by ID
 * - Pre-populate form with existing values
 * - Add/remove items from report
 * - Recalculate total on item changes
 * - Database update via reportService
 * - Zustand store synchronization
 * - Error handling with alerts
 * - Loading states
 *
 * Route params:
 * - id (required): Report ID to edit
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, Card } from '@/components/common';
import { loadReport, updateReportDetails } from '@/services/report';
import { useItemStore } from '@/store/itemStore';
import { useReportStore } from '@/store/reportStore';
import type { Report, Item } from '@/types';
import { isExpense } from '@/types/item';

export default function ReportEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [title, setTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { items, loadItems } = useItemStore();
  const updateReportInStore = useReportStore((state) => state.updateReport);
  const colorScheme = useColorScheme();

  // Load report and items on mount
  useEffect(() => {
    loadData();
    loadItems();
  }, [id]);

  /**
   * Load report data from database
   */
  const loadData = async () => {
    if (!id) {
      Alert.alert('오류', '잘못된 접근입니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
      return;
    }

    try {
      setIsLoading(true);
      const fetchedReport = await loadReport(id);

      if (!fetchedReport) {
        Alert.alert('오류', '리포트를 찾을 수 없습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
        return;
      }

      // Check if report is still in draft status
      if (fetchedReport.status !== 'draft') {
        Alert.alert('오류', 'draft 상태의 리포트만 편집할 수 있습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
        return;
      }

      setReport(fetchedReport);
      setTitle(fetchedReport.title);
      // Use itemIds from the unified model, or fallback to receiptIds for legacy support
      const itemIdsToLoad = fetchedReport.itemIds || fetchedReport.receiptIds || [];
      setSelectedIds(itemIdsToLoad);
    } catch (error) {
      console.error('Report load error:', error);
      Alert.alert('오류', '리포트를 불러오는 중 오류가 발생했습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter to only show expense items (personal_card or corporate_card)
  const expenseItems = useMemo(() => {
    return items.filter(item => isExpense(item));
  }, [items]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return expenseItems
      .filter(item => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [expenseItems, selectedIds]);

  // Toggle item selection
  const toggleSelect = (itemId: string) => {
    setSelectedIds(prev =>
      prev.includes(itemId)
        ? prev.filter(i => i !== itemId)
        : [...prev, itemId]
    );
  };

  // Toggle select all items
  const toggleSelectAll = () => {
    if (selectedIds.length === expenseItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(expenseItems.map(item => item.id));
    }
  };

  /**
   * Handle form submission for edit
   */
  const handleSubmit = async () => {
    if (!id || !report) {
      Alert.alert('오류', '리포트 정보를 찾을 수 없습니다.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('오류', '리포트 제목을 입력해주세요.');
      return;
    }

    if (selectedIds.length === 0) {
      Alert.alert('오류', '최소 1개 이상의 항목을 선택해주세요.');
      return;
    }

    try {
      setIsSaving(true);

      // Update report
      const updatedReport = await updateReportDetails(id, {
        title: title.trim(),
        itemIds: selectedIds,
      });

      // Update Zustand store
      updateReportInStore(id, {
        title: updatedReport.title,
        itemIds: updatedReport.itemIds,
        totalAmount: updatedReport.totalAmount,
        updatedAt: updatedReport.updatedAt,
      });

      // Navigate back with success message
      Alert.alert('성공', '리포트가 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Report update error:', error);
      handleSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle save errors with user-friendly messages
   */
  const handleSaveError = (error: unknown) => {
    let errorTitle = '수정 실패';
    let errorMessage = '수정 중 오류가 발생했습니다.';

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // Database errors
      if (errorMsg.includes('database') || errorMsg.includes('sql')) {
        errorTitle = '데이터베이스 오류';
        errorMessage = '리포트 수정에 실패했습니다.\n잠시 후 다시 시도해주세요.';
        console.error('[Database Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      // Generic errors
      else {
        console.error('[Unknown Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      console.error('[Non-Error Exception]', {
        error: JSON.stringify(error),
        timestamp: new Date().toISOString(),
      });
    }

    Alert.alert(errorTitle, errorMessage);
  };

  // Render item row
  const renderItemRow = ({ item }: { item: Item }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item.id)}
        className={`flex-row items-center p-3 rounded-lg mb-2 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.storeName || item.title}, ${item.amount?.toLocaleString() || '0'}원, ${item.date}`}
      >
        {/* Checkbox */}
        <View
          className={`w-6 h-6 rounded-md mr-3 items-center justify-center ${isSelected ? 'bg-blue-600' : 'border-2 border-gray-300 dark:border-gray-600'}`}
          accessibilityElementsHidden={true}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>

        {/* Item info */}
        <View className="flex-1">
          <Text className="font-medium text-gray-900 dark:text-gray-100">{item.storeName || item.title}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{item.date}</Text>
        </View>

        {/* Amount */}
        {item.amount !== undefined && (
          <Text className="font-semibold text-gray-900 dark:text-gray-100">₩{item.amount.toLocaleString()}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top', 'left', 'right', 'bottom']}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-4 text-gray-500">리포트 불러오는 중...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Report not found state
  if (!report) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top', 'left', 'right', 'bottom']}>
          <View className="flex-1 items-center justify-center">
            <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-gray-500">리포트를 찾을 수 없습니다</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="뒤로 가기"
          >
            <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
            리포트 편집
          </Text>
          <View style={{ width: 24 }} />
        </View>

      <ScrollView className="flex-1 p-4">
        {/* Title Input */}
        <Input
          label="리포트 제목"
          value={title}
          onChangeText={setTitle}
          placeholder="예: 2024년 1월 경비"
        />

        {/* Total Amount Display */}
        <Card className="my-4">
          <Text className="text-gray-500">선택된 항목 총액</Text>
          <Text className="text-2xl font-bold text-blue-600 mt-1">₩{totalAmount.toLocaleString()}</Text>
          <Text className="text-sm text-gray-400">{selectedIds.length}건 선택됨</Text>
        </Card>

        {/* Item Selection */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-semibold text-gray-900 dark:text-gray-100">항목 선택</Text>
          <TouchableOpacity
            onPress={toggleSelectAll}
            accessibilityRole="button"
            accessibilityLabel={selectedIds.length === expenseItems.length ? '전체 해제' : '전체 선택'}
          >
            <Text className="text-blue-600">
              {selectedIds.length === expenseItems.length ? '전체 해제' : '전체 선택'}
            </Text>
          </TouchableOpacity>
        </View>

        {expenseItems.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">항목이 없습니다</Text>
          </View>
        ) : (
          <View>
            {expenseItems.map(item => (
              <View key={item.id}>{renderItemRow({ item })}</View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <Button
          title="수정 완료"
          onPress={handleSubmit}
          variant="primary"
          loading={isSaving}
          disabled={selectedIds.length === 0}
        />
      </View>
      </SafeAreaView>
    </>
  );
}
