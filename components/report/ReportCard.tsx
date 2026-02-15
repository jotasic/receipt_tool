import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { Report } from '@/types';

interface ReportCardProps {
  report: Report;
  onPress?: () => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'draft': return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    case 'submitted': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    default: return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
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

export function ReportCard({ report, onPress }: ReportCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/report/${report.id}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 shadow-sm border border-gray-100 dark:border-gray-700"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>
            {report.title}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {report.createdAt?.split('T')[0] || '날짜 없음'}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
          <Text className="text-xs font-medium">{getStatusLabel(report.status)}</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          항목 {report.itemIds?.length || report.receiptIds?.length || 0}건
        </Text>
        <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">
          ₩{report.totalAmount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
