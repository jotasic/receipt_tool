import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReceiptStore } from '@/store';
import { DEFAULT_CATEGORIES } from '@/constants';
import { Button } from '@/components/common';
import type { Receipt } from '@/types';

// FilterChip component
interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

function FilterChip({ label, active = false, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`
        px-4 py-2 rounded-full mr-2
        ${active ? 'bg-blue-600' : 'bg-gray-200'}
      `}
      activeOpacity={0.7}
    >
      <Text
        className={`
          font-medium
          ${active ? 'text-white' : 'text-gray-700'}
        `}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// 영수증 카드 컴포넌트
function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const category = DEFAULT_CATEGORIES.find(c => c.id === receipt.category);

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: receipt.id } })}
      className="flex-row bg-white p-3 rounded-lg mb-2 shadow-sm"
      activeOpacity={0.7}
    >
      {/* 이미지 썸네일 */}
      {receipt.imagePath ? (
        <Image
          source={{ uri: receipt.imagePath }}
          className="w-16 h-16 rounded-md"
          resizeMode="cover"
        />
      ) : (
        <View className="w-16 h-16 rounded-md bg-gray-200 items-center justify-center">
          <Ionicons name="receipt-outline" size={24} color="#9CA3AF" />
        </View>
      )}

      {/* 정보 */}
      <View className="flex-1 ml-3 justify-center">
        <Text className="font-semibold text-gray-900" numberOfLines={1}>
          {receipt.storeName || receipt.title}
        </Text>
        <Text className="text-sm text-gray-500 mt-0.5">{receipt.date}</Text>
        {category && (
          <View className="flex-row items-center mt-1">
            <View
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: category.color }}
            />
            <Text className="text-xs text-gray-400">{category.name}</Text>
          </View>
        )}
      </View>

      {/* 금액 */}
      <View className="justify-center items-end">
        <Text className="font-bold text-blue-600">₩{receipt.amount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );
}

// 빈 상태 컴포넌트
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <View className="flex-1 items-center justify-center px-4 py-20">
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text className="text-xl font-semibold text-gray-900 mt-4">
        {hasFilter ? '영수증이 없습니다' : '영수증이 없습니다'}
      </Text>
      <Text className="text-base text-gray-500 mt-2 mb-6 text-center">
        {hasFilter ? '이 카테고리에 해당하는 영수증이 없습니다' : '영수증을 추가해보세요'}
      </Text>
      {!hasFilter && (
        <Button
          title="영수증 추가"
          onPress={() => router.push('/')}
          variant="primary"
        />
      )}
    </View>
  );
}

export default function ReceiptsScreen() {
  const { receipts, isLoading, loadReceipts } = useReceiptStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  }, [loadReceipts]);

  // 필터링
  const filteredReceipts = activeFilter === 'all'
    ? receipts
    : receipts.filter(r => r.category === activeFilter);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* 헤더 */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">영수증</Text>
      </View>

      {/* 필터 */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <FilterChip
            label="전체"
            active={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          {DEFAULT_CATEGORIES.map(cat => (
            <FilterChip
              key={cat.id}
              label={cat.name}
              active={activeFilter === cat.id}
              onPress={() => setActiveFilter(cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 목록 */}
      <FlatList
        data={filteredReceipts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReceiptCard receipt={item} />}
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState hasFilter={activeFilter !== 'all'} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
