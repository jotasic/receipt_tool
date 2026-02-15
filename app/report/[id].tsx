import { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { loadReport, submitReport } from '@/services/report';
import { getReceiptById } from '@/services/database';
import { useReportStore } from '@/store/reportStore';
import type { Report, Receipt } from '@/types';

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
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const receiptPromises = (reportData.receiptIds || []).map(rid => getReceiptById(rid));
        const receiptResults = await Promise.all(receiptPromises);
        setReceipts(receiptResults.filter((r): r is Receipt => r !== null));
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">로딩 중...</Text>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-500 mt-4">리포트를 찾을 수 없습니다.</Text>
        <View className="mt-4">
          <Button title="돌아가기" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">리포트 상세</Text>
        <View style={{ width: 24 }} />
      </View>

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
                <Text className="text-gray-500">영수증 수</Text>
                <Text className="text-gray-900">{receipts.length}건</Text>
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

        {/* Receipts */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-semibold mb-3">포함된 영수증</Text>
          {receipts.map((receipt) => (
            <TouchableOpacity
              key={receipt.id}
              onPress={() => router.push(`/item/${receipt.id}`)}
              className="flex-row items-center bg-white p-3 rounded-lg mb-2"
            >
              <View className="w-10 h-10 bg-gray-100 rounded-md items-center justify-center mr-3">
                <Ionicons name="receipt-outline" size={20} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">{receipt.storeName || receipt.title}</Text>
                <Text className="text-sm text-gray-500">{receipt.date}</Text>
              </View>
              <Text className="font-semibold text-gray-900">₩{receipt.amount.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Submit Button (only for draft) */}
      {report.status === 'draft' && (
        <View className="p-4 bg-white border-t border-gray-200">
          <Button
            title="리포트 제출"
            onPress={handleSubmit}
            variant="primary"
            loading={isSubmitting}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
