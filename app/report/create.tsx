import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, Card } from '@/components/common';
import { useReceiptStore } from '@/store';
import { useReportStore } from '@/store/reportStore';
import { createReportWithReceipts } from '@/services/report';
import type { Receipt } from '@/types';

export default function CreateReportScreen() {
  const { receipts, loadReceipts } = useReceiptStore();
  const [title, setTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  // 총액 계산
  const totalAmount = useMemo(() => {
    return receipts
      .filter(r => selectedIds.includes(r.id))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [receipts, selectedIds]);

  // 영수증 선택/해제 토글
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.length === receipts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(receipts.map(r => r.id));
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('오류', '리포트 제목을 입력해주세요');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('오류', '영수증을 선택해주세요');
      return;
    }

    setIsLoading(true);
    try {
      const report = await createReportWithReceipts({
        title: title.trim(),
        receiptIds: selectedIds,
      });
      useReportStore.getState().addReport(report);
      Alert.alert('성공', '리포트가 생성되었습니다', [
        { text: '확인', onPress: () => router.replace('/(tabs)/reports') }
      ]);
    } catch (error) {
      Alert.alert('오류', '리포트 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 영수증 선택 항목 렌더링
  const renderReceiptItem = ({ item }: { item: Receipt }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item.id)}
        className={`flex-row items-center p-3 rounded-lg mb-2 ${isSelected ? 'bg-blue-50 border border-blue-300' : 'bg-white border border-gray-200'}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.storeName || item.title}, ${item.amount.toLocaleString()}원, ${item.date}`}
      >
        {/* 체크박스 */}
        <View
          className={`w-6 h-6 rounded-md mr-3 items-center justify-center ${isSelected ? 'bg-blue-600' : 'border-2 border-gray-300'}`}
          accessibilityElementsHidden={true}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>

        {/* 영수증 정보 */}
        <View className="flex-1">
          <Text className="font-medium text-gray-900">{item.storeName || item.title}</Text>
          <Text className="text-sm text-gray-500">{item.date}</Text>
        </View>

        {/* 금액 */}
        <Text className="font-semibold text-gray-900">₩{item.amount.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* 헤더 */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900">리포트 생성</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        {/* 제목 입력 */}
        <Input
          label="리포트 제목"
          value={title}
          onChangeText={setTitle}
          placeholder="예: 2024년 1월 경비"
        />

        {/* 총액 표시 */}
        <Card className="my-4">
          <Text className="text-gray-500">선택된 영수증 총액</Text>
          <Text className="text-2xl font-bold text-blue-600 mt-1">₩{totalAmount.toLocaleString()}</Text>
          <Text className="text-sm text-gray-400">{selectedIds.length}건 선택됨</Text>
        </Card>

        {/* 영수증 선택 */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-semibold text-gray-900">영수증 선택</Text>
          <TouchableOpacity
            onPress={toggleSelectAll}
            accessibilityRole="button"
            accessibilityLabel={selectedIds.length === receipts.length ? '전체 해제' : '전체 선택'}
          >
            <Text className="text-blue-600">
              {selectedIds.length === receipts.length ? '전체 해제' : '전체 선택'}
            </Text>
          </TouchableOpacity>
        </View>

        {receipts.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">영수증이 없습니다</Text>
          </View>
        ) : (
          <View>
            {receipts.map(receipt => (
              <View key={receipt.id}>{renderReceiptItem({ item: receipt })}</View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 생성 버튼 */}
      <View className="p-4 bg-white border-t border-gray-200">
        <Button
          title="리포트 생성"
          onPress={handleCreate}
          variant="primary"
          loading={isLoading}
          disabled={selectedIds.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
