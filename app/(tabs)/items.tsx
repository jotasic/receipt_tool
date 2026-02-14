import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ItemCard } from '@/components/item';
import { useItemStore } from '@/store/itemStore';
import { CLASSIFICATIONS } from '@/constants/items';
import type { Item, ItemClassification, UsagePurpose } from '@/types/item';
import { isExpense } from '@/types/item';

type FilterType = 'all' | ItemClassification;

const FILTER_OPTIONS: Array<{
  id: FilterType;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'all', name: '전체', icon: 'apps' },
  { id: 'personal_card', name: '개인카드', icon: 'card' },
  { id: 'corporate_card', name: '법인카드', icon: 'business' },
  { id: 'proof_document', name: '증명', icon: 'document-text' },
];

export default function ItemsScreen() {
  const { items, isLoading, loadItems } = useItemStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Load items when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    const filtered =
      selectedFilter === 'all'
        ? items
        : items.filter((item) => item.classification === selectedFilter);

    // Sort by date DESC (most recent first)
    return filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [items, selectedFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = filteredItems.length;

    // Calculate total amount (excluding proof documents without amount)
    const totalAmount = filteredItems.reduce((sum, item) => {
      if (isExpense(item) && item.amount !== undefined && item.amount !== null) {
        return sum + item.amount;
      }
      return sum;
    }, 0);

    // Count by classification
    const countByClassification = filteredItems.reduce((acc, item) => {
      acc[item.classification] = (acc[item.classification] || 0) + 1;
      return acc;
    }, {} as Record<ItemClassification, number>);

    return {
      totalItems,
      totalAmount,
      countByClassification,
    };
  }, [filteredItems]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  const handleAddItem = () => {
    router.push('/item/add' as any);
  };

  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter);
  };

  const formatAmount = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`;
  };

  const renderHeader = () => (
    <View className="mb-4">
      {/* Stats Card */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-white/80 text-sm font-medium mb-1">
              총 항목
            </Text>
            <Text className="text-white text-3xl font-bold">
              {stats.totalItems}건
            </Text>
          </View>
          <View className="bg-white/20 rounded-full p-4">
            <Ionicons name="receipt" size={32} color="#FFFFFF" />
          </View>
        </View>

        {/* Total Amount */}
        <View className="border-t border-white/20 pt-3">
          <Text className="text-white/80 text-sm font-medium mb-1">
            총 금액
          </Text>
          <Text className="text-white text-2xl font-bold">
            {formatAmount(stats.totalAmount)}
          </Text>
        </View>

        {/* Count by Classification */}
        {selectedFilter === 'all' && (
          <View className="border-t border-white/20 pt-3 mt-3">
            <View className="flex-row items-center justify-between">
              {CLASSIFICATIONS.map((classification) => {
                const count = stats.countByClassification[classification.id] || 0;
                return (
                  <View key={classification.id} className="flex-1 items-center">
                    <Text className="text-white/80 text-xs font-medium mb-1">
                      {classification.name}
                    </Text>
                    <Text className="text-white text-lg font-bold">
                      {count}건
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View className="mb-4">
        <FlatList
          data={FILTER_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.id;
            return (
              <TouchableOpacity
                onPress={() => handleFilterChange(item.id)}
                className={`
                  px-4 py-2 rounded-full flex-row items-center
                  ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}
                `}
                activeOpacity={0.7}
                accessibilityLabel={`${item.name} 필터`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  className={`
                    ml-2 text-sm font-semibold
                    ${isSelected ? 'text-white' : 'text-gray-700'}
                  `}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-gray-900">
          항목 목록
        </Text>
        <Text className="text-sm text-gray-500">
          {filteredItems.length}건
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-16">
      <View className="bg-gray-100 rounded-full p-6 mb-4">
        <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 text-lg font-semibold mb-2">
        등록된 항목이 없습니다
      </Text>
      <Text className="text-gray-500 text-base text-center mb-6">
        {selectedFilter === 'all'
          ? '하단의 + 버튼을 눌러\n첫 항목을 등록해보세요'
          : `${FILTER_OPTIONS.find((f) => f.id === selectedFilter)?.name} 항목이 없습니다`}
      </Text>
      {selectedFilter !== 'all' && (
        <TouchableOpacity
          onPress={() => setSelectedFilter('all')}
          className="px-4 py-2 bg-blue-50 rounded-lg"
          activeOpacity={0.7}
          accessibilityLabel="전체 보기"
          accessibilityRole="button"
        >
          <Text className="text-blue-600 font-medium">전체 보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderItem = ({ item }: { item: Item }) => (
    <ItemCard item={item} />
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-gray-500">항목 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-3 bg-white border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900">항목 관리</Text>
      </View>

      {/* Item List */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleAddItem}
        className="absolute bottom-6 right-6 bg-blue-600 rounded-full w-16 h-16 items-center justify-center active:bg-blue-700"
        style={{
          shadowColor: '#2563eb',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}
        activeOpacity={0.8}
        accessibilityLabel="항목 추가"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
