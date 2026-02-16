import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ItemCard } from '@/components/item';
import { MonthSelector, SelectableChip } from '@/components/common';
import { TabScreenLayout } from '@/design-system/layouts';
import { useItemStore } from '@/store/itemStore';
import { CLASSIFICATIONS } from '@/constants/items';
import type { Item, ItemClassification, UsagePurpose, Tag } from '@/types';
import { isExpense } from '@/types/item';
import { getTags } from '@/services/database/tagService';

type FilterType = 'all' | ItemClassification;

// Generate filter options from CLASSIFICATIONS constant (single source of truth)
const FILTER_OPTIONS: Array<{
  id: FilterType;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'all', name: '전체', icon: 'apps' },
  ...CLASSIFICATIONS.map((c) => ({
    id: c.id as FilterType,
    name: c.name,
    icon: c.icon as keyof typeof Ionicons.glyphMap,
  })),
];

// Type guard to check if value is a valid ItemClassification
function isItemClassification(value: string): value is ItemClassification {
  return CLASSIFICATIONS.some((c) => c.id === value);
}

export default function ItemsScreen() {
  const { items, isLoading, loadItems } = useItemStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());

  // Get URL parameters
  const params = useLocalSearchParams<{ classification?: string }>();

  // Load items when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  // Load tags on mount
  useEffect(() => {
    loadAllTags();
  }, []);

  // Set initial filter from URL parameter
  useEffect(() => {
    if (params.classification && isItemClassification(params.classification)) {
      setSelectedFilter(params.classification as FilterType);
      // Clear URL parameter after setting filter
      router.replace('/(tabs)/items');
    }
  }, [params.classification]);

  const loadAllTags = async () => {
    try {
      const allTags = await getTags();
      setTags(allTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  // Filter items based on selected filter, tags, and month
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by month
    if (selectedMonth !== null) {
      const selectedYear = selectedMonth.getFullYear();
      const selectedMonthIndex = selectedMonth.getMonth();

      result = result.filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getFullYear() === selectedYear &&
          itemDate.getMonth() === selectedMonthIndex
        );
      });
    }

    // Filter by classification
    if (selectedFilter !== 'all') {
      result = result.filter((item) => item.classification === selectedFilter);
    }

    // Filter by tags (if any tags selected)
    if (selectedTags.length > 0) {
      result = result.filter((item) => {
        // Item must have at least one of the selected tags
        if (!item.tags || item.tags.length === 0) return false;

        const itemTagIds = item.tags.map((tag) => tag.id);
        return selectedTags.some((tagId) => itemTagIds.includes(tagId));
      });
    }

    // Sort by date DESC (most recent first)
    return result.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [items, selectedFilter, selectedTags, selectedMonth]);

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

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        // Remove tag
        return prev.filter((id) => id !== tagId);
      } else {
        // Add tag
        return [...prev, tagId];
      }
    });
  };

  const clearFilters = () => {
    setSelectedFilter('all');
    setSelectedTags([]);
    setSelectedMonth(null);
  };

  const handleMonthChange = (month: Date | null) => {
    setSelectedMonth(month);
  };

  const formatAmount = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`;
  };

  const getSelectedMonthText = () => {
    if (selectedMonth === null) {
      return '전체 기간';
    }
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    return `${year}년 ${month}월`;
  };

  const renderHeader = () => (
    <View className="mb-4">
      {/* Month Selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Stats Card */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-5 mb-4">
        {/* Selected Period Indicator */}
        <View className="mb-3 pb-3 border-b border-white/20 dark:border-white/10">
          <Text className="text-white/80 dark:text-white/70 text-xs font-medium mb-1">
            조회 기간
          </Text>
          <Text className="text-white text-base font-bold">
            {getSelectedMonthText()}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-white/80 dark:text-white/70 text-sm font-medium mb-1">
              총 항목
            </Text>
            <Text className="text-white text-3xl font-bold">
              {stats.totalItems}건
            </Text>
          </View>
          <View className="bg-white/20 dark:bg-white/10 rounded-full p-4">
            <Ionicons name="receipt" size={32} color="#FFFFFF" />
          </View>
        </View>

        {/* Total Amount */}
        <View className="border-t border-white/20 dark:border-white/10 pt-3">
          <Text className="text-white/80 dark:text-white/70 text-sm font-medium mb-1">
            총 금액
          </Text>
          <Text className="text-white text-2xl font-bold">
            {formatAmount(stats.totalAmount)}
          </Text>
        </View>

        {/* Count by Classification */}
        {selectedFilter === 'all' && (
          <View className="border-t border-white/20 dark:border-white/10 pt-3 mt-3">
            <View className="flex-row items-center justify-between">
              {CLASSIFICATIONS.map((classification) => {
                const count = stats.countByClassification[classification.id] || 0;
                return (
                  <View key={classification.id} className="flex-1 items-center">
                    <Text className="text-white/80 dark:text-white/70 text-xs font-medium mb-1">
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
          renderItem={({ item }) => (
            <SelectableChip
              label={item.name}
              isSelected={selectedFilter === item.id}
              onPress={() => handleFilterChange(item.id)}
              icon={item.icon}
            />
          )}
        />
      </View>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            태그 필터
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {/* "All" chip */}
            <SelectableChip
              label="전체"
              isSelected={selectedTags.length === 0}
              onPress={() => setSelectedTags([])}
            />

            {/* Tag chips */}
            {tags.map((tag) => (
              <SelectableChip
                key={tag.id}
                label={tag.name}
                isSelected={selectedTags.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
                color={tag.color}
                variant="outlined"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Clear Filter Button */}
      {(selectedFilter !== 'all' || selectedTags.length > 0 || selectedMonth === null) && (
        <View className="mb-4">
          <TouchableOpacity
            onPress={clearFilters}
            className="flex-row items-center justify-center py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
            activeOpacity={0.7}
            accessibilityLabel="필터 초기화"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
            <Text className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              필터 초기화
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
          항목 목록
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          총 {filteredItems.length}건
          {selectedTags.length > 0 && ` (태그: ${selectedTags.length}개)`}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    const hasActiveFilters = selectedFilter !== 'all' || selectedTags.length > 0 || selectedMonth !== null;

    return (
      <View className="items-center justify-center py-16">
        <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
          <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
        </View>
        <Text className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-2">
          {hasActiveFilters ? '필터 조건에 맞는 항목이 없습니다' : '등록된 항목이 없습니다'}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-base text-center mb-6">
          {hasActiveFilters
            ? '다른 필터 조건을 선택하거나\n필터를 초기화해보세요'
            : '하단의 + 버튼을 눌러\n첫 항목을 등록해보세요'}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity
            onPress={clearFilters}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
            activeOpacity={0.7}
            accessibilityLabel="필터 초기화"
            accessibilityRole="button"
          >
            <Text className="text-blue-600 dark:text-blue-400 font-medium">필터 초기화</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: Item }) => (
    <ItemCard item={item} />
  );

  if (isLoading && !isRefreshing) {
    return (
      <TabScreenLayout title="증빙">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-gray-500 dark:text-gray-400">항목 불러오는 중...</Text>
        </View>
      </TabScreenLayout>
    );
  }

  return (
    <TabScreenLayout title="증빙" scrollable={false}>
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
    </TabScreenLayout>
  );
}
