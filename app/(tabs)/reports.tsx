import { useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { ReportCard } from '@/components/report/ReportCard';
import { useReportStore } from '@/store/reportStore';

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
      <Text className="text-lg font-semibold mt-4 text-gray-900 dark:text-gray-100">
        리포트가 없습니다
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
        항목을 모아 경비 청구 리포트를 생성해보세요
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
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100">리포트</Text>
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
    </>
  );
}
