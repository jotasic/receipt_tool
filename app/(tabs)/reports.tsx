import { useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { useReportStore } from '@/store/reportStore';
import type { Report } from '@/types';

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

function ReportCard({ report }: { report: Report }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/report/${report.id}`)}
      className="bg-white p-4 rounded-lg mb-3 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
            {report.title}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {report.createdAt?.split('T')[0] || '날짜 없음'}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
          <Text className="text-xs font-medium">{getStatusLabel(report.status)}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <Text className="text-sm text-gray-500">
          영수증 {report.receiptIds?.length || 0}건
        </Text>
        <Text className="text-lg font-bold text-blue-600">
          ₩{report.totalAmount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
      <Text className="text-lg font-semibold mt-4 text-gray-900">
        리포트가 없습니다
      </Text>
      <Text className="text-gray-500 mt-2 text-center">
        영수증을 모아 경비 청구 리포트를 생성해보세요
      </Text>
      <View className="mt-6">
        <Button
          title="리포트 생성"
          onPress={() => router.push('/report/create')}
          variant="primary"
        />
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const { reports, isLoading, loadReports } = useReportStore();

  useEffect(() => {
    loadReports();
  }, []);

  const onRefresh = useCallback(async () => {
    await loadReports();
  }, [loadReports]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">리포트</Text>
        {reports.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/report/create')}>
            <Ionicons name="add-circle" size={28} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      {reports.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportCard report={item} />}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
