import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getReceiptById } from '@/services/database';
import { deleteReceiptWithImage } from '@/services/receipt';
import { DEFAULT_CATEGORIES } from '@/constants';
import type { Receipt } from '@/types';

const { width } = Dimensions.get('window');

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReceipt();
  }, [id]);

  const loadReceipt = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getReceiptById(id);
      setReceipt(data);
    } catch (error) {
      console.error('Failed to load receipt:', error);
      Alert.alert('오류', '영수증을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!id || !receipt) return;

    Alert.alert(
      '삭제 확인',
      '이 영수증을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReceiptWithImage(id, receipt?.imagePath);
              router.back();
            } catch (error) {
              console.error('Failed to delete receipt:', error);
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const category = receipt ? DEFAULT_CATEGORIES.find(c => c.id === receipt.category) : null;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!receipt) {
    return <NotFoundScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          activeOpacity={0.7}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">영수증 상세</Text>
        <TouchableOpacity
          onPress={handleDelete}
          className="w-10 h-10 items-center justify-center"
          activeOpacity={0.7}
          accessibilityLabel="영수증 삭제"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Receipt Image */}
        {receipt.imagePath && (
          <View className="bg-gray-100">
            <Image
              source={{ uri: receipt.imagePath }}
              style={{ width, height: width * 1.2 }}
              resizeMode="contain"
              accessibilityLabel="영수증 이미지"
            />
          </View>
        )}

        {/* Receipt Information */}
        <View className="p-4">
          {/* Amount */}
          <View className="items-center py-6">
            <Text className="text-sm text-gray-500 mb-1">결제 금액</Text>
            <Text className="text-4xl font-bold text-blue-600">
              ₩{receipt.amount.toLocaleString()}
            </Text>
          </View>

          {/* Details */}
          <View className="bg-gray-50 rounded-lg overflow-hidden">
            <InfoRow
              label="상호명"
              value={receipt.storeName || '-'}
              isFirst
            />
            <InfoRow
              label="날짜"
              value={formatDate(receipt.date)}
            />
            <InfoRow
              label="카테고리"
              value={category?.name || '-'}
              color={category?.color}
            />
            {receipt.ocrText && (
              <InfoRow
                label="메모"
                value={receipt.ocrText}
                isLast
              />
            )}
          </View>

          {/* Metadata */}
          <View className="mt-6 pt-6 border-t border-gray-200">
            <Text className="text-xs text-gray-400 text-center mb-1">
              등록일: {formatDateTime(receipt.createdAt)}
            </Text>
            {receipt.updatedAt !== receipt.createdAt && (
              <Text className="text-xs text-gray-400 text-center">
                수정일: {formatDateTime(receipt.updatedAt)}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  color?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

function InfoRow({ label, value, color, isFirst = false, isLast = false }: InfoRowProps) {
  return (
    <View
      className={`
        flex-row justify-between items-center px-4 py-4
        ${!isLast ? 'border-b border-gray-200' : ''}
      `}
    >
      <Text className="text-sm text-gray-600">{label}</Text>
      <View className="flex-row items-center max-w-[60%]">
        {color && (
          <View
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: color }}
            accessibilityLabel={`${label} 색상 표시`}
          />
        )}
        <Text
          className="text-base font-medium text-gray-900 text-right"
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">영수증 상세</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-base text-gray-600">불러오는 중...</Text>
      </View>
    </SafeAreaView>
  );
}

function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">영수증 상세</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-gray-100 rounded-full p-6 mb-4">
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          영수증을 찾을 수 없습니다
        </Text>
        <Text className="text-base text-gray-500 text-center mb-6">
          해당 영수증이 삭제되었거나{'\n'}존재하지 않습니다
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-600 px-6 py-3 rounded-lg active:bg-blue-700"
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold text-base">돌아가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Date formatting helpers
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}
