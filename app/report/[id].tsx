import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header } from '@/components/common';
import { loadReport, submitReport, deleteReport } from '@/services/report';
import { getItemById } from '@/services/database/itemService';
import { useReportStore } from '@/store/reportStore';
import type { Report, Item } from '@/types';
import { isExpense } from '@/types/item';

function getStatusColor(status: string) {
  switch (status) {
    case 'draft': return 'bg-gray-200 text-gray-700';
    case 'submitted': return 'bg-blue-100 text-blue-700';
    case 'approved': return 'bg-green-100 text-green-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-200 text-gray-700';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'draft': return '작성중';
    case 'submitted': return '제출됨';
    case 'approved': return '승인됨';
    case 'rejected': return '반려됨';
    default: return status;
  }
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteReportFromStore = useReportStore((state) => state.deleteReport);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const reportData = await loadReport(id);
      if (reportData) {
        setReport(reportData);
        // Use itemIds from the unified model, or fallback to receiptIds for legacy support
        const itemIdsToLoad = reportData.itemIds || reportData.receiptIds || [];
        const itemPromises = itemIdsToLoad.map(itemId => getItemById(itemId));
        const itemResults = await Promise.all(itemPromises);
        setItems(itemResults.filter((i): i is Item => i !== null));
      }
    } catch (error) {
      Alert.alert('오류', '리포트를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      '리포트 제출',
      '이 리포트를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const updatedReport = await submitReport(id!);
              setReport(updatedReport);
              useReportStore.getState().updateReport(id!, { status: 'submitted' });
              Alert.alert('성공', '리포트가 제출되었습니다.');
            } catch (error) {
              Alert.alert('오류', '제출에 실패했습니다.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    if (!id) return;
    router.push(`/report/edit?id=${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      '리포트 삭제',
      '이 리포트를 삭제하시겠습니까?\n삭제된 리포트는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!id || !report) return;

    // Prevent duplicate deletion attempts
    if (isDeleting) {
      console.warn('Delete already in progress');
      return;
    }

    // Verify report is in draft status
    if (report.status !== 'draft') {
      Alert.alert('삭제 불가', 'draft 상태의 리포트만 삭제할 수 있습니다.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteReport(id);
      deleteReportFromStore(id);

      // Navigate immediately after store update
      router.back();
    } catch (error) {
      console.error('Report delete error:', error);
      Alert.alert('삭제 실패', '리포트 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center" edges={['top', 'left', 'right', 'bottom']}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-gray-500">로딩 중...</Text>
        </SafeAreaView>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center" edges={['top', 'left', 'right', 'bottom']}>
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4">리포트를 찾을 수 없습니다.</Text>
          <View className="mt-4">
            <Button title="돌아가기" onPress={() => router.back()} variant="outline" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top', 'left', 'right', 'bottom']}>
        <Header title="리포트 상세" showBack />

      <ScrollView className="flex-1">
        {/* Report Info */}
        <View className="p-4">
          <Card>
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-xl font-bold text-gray-900 flex-1" numberOfLines={2}>
                {report.title}
              </Text>
              <View className={`px-3 py-1 rounded-full ml-2 ${getStatusColor(report.status)}`}>
                <Text className="text-sm font-medium">{getStatusLabel(report.status)}</Text>
              </View>
            </View>

            <View className="border-t border-gray-100 pt-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">생성일</Text>
                <Text className="text-gray-900">{report.createdAt?.split('T')[0]}</Text>
              </View>
              {report.submittedAt && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">제출일</Text>
                  <Text className="text-gray-900">{report.submittedAt.split('T')[0]}</Text>
                </View>
              )}
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">항목 수</Text>
                <Text className="text-gray-900">{items.length}건</Text>
              </View>
            </View>

            <View className="border-t border-gray-100 pt-3 mt-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500">총 금액</Text>
                <Text className="text-2xl font-bold text-blue-600">
                  ₩{report.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Items */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">포함된 항목</Text>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/item/${item.id}`)}
              className="flex-row items-center bg-white dark:bg-gray-800 p-3 rounded-lg mb-2"
            >
              <View className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-md items-center justify-center mr-3">
                <Ionicons name="receipt-outline" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900 dark:text-gray-100">{item.storeName || item.title}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">{item.date}</Text>
              </View>
              {item.amount !== undefined && (
                <Text className="font-semibold text-gray-900 dark:text-gray-100">₩{item.amount.toLocaleString()}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons (only for draft) */}
      {report.status === 'draft' && (
        <View className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Button
                title="편집"
                onPress={handleEdit}
                variant="outline"
                disabled={isDeleting || isSubmitting}
                icon={<Ionicons name="create-outline" size={20} color="#2563eb" />}
              />
            </View>
            <View className="flex-1">
              <Button
                title={isDeleting ? '삭제 중...' : '삭제'}
                onPress={handleDelete}
                variant="outline"
                disabled={isDeleting || isSubmitting}
                loading={isDeleting}
                icon={
                  !isDeleting ? (
                    <Ionicons name="trash-outline" size={20} color="#2563eb" />
                  ) : undefined
                }
              />
            </View>
          </View>
          <Button
            title="리포트 제출"
            onPress={handleSubmit}
            variant="primary"
            loading={isSubmitting}
            disabled={isDeleting}
          />
        </View>
      )}
      </SafeAreaView>
    </>
  );
}
