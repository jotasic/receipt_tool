import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ItemCard, ItemForm, ItemsFilterSheet } from '@/components/item';
import type { DateFilter, FilterState } from '@/components/item';
import { SelectableChip, Header } from '@/components/common';
import { TabScreenContent } from '@/design-system/layouts';
import { useItemStore } from '@/store/itemStore';
import { CLASSIFICATIONS } from '@/constants/items';
import type { Item, ItemClassification, Tag, CreateItemInput } from '@/types';
import { isExpense } from '@/types/item';
import { getTags } from '@/services/database/tagService';
import { createItem } from '@/services/database/itemService';
import { setTagsForItem } from '@/services/database/tagService';
import { setItemCustomValues } from '@/services/database/customFieldService';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';

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
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'this_month' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const iconColor = useThemeColor('#374151', '#D1D5DB');

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

  // Filter items based on selected filter, tags, and dateFilter
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by dateFilter
    if (dateFilter.type !== 'all') {
      const now = new Date();
      let from: Date;
      let to: Date;

      if (dateFilter.type === 'this_month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (dateFilter.type === 'last_month') {
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      } else if (dateFilter.type === 'last_3_months') {
        from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (
        dateFilter.type === 'custom' &&
        dateFilter.from != null &&
        dateFilter.to != null
      ) {
        from = dateFilter.from;
        to = dateFilter.to;
      } else {
        from = new Date(0);
        to = new Date();
      }

      result = result.filter((item) => {
        const d = new Date(item.date);
        return d >= from && d <= to;
      });
    }

    // Filter by classification
    if (selectedFilter !== 'all') {
      result = result.filter((item) => item.classification === selectedFilter);
    }

    // Filter by tags (if any tags selected)
    if (selectedTags.length > 0) {
      result = result.filter((item) => {
        if (!item.tags || item.tags.length === 0) return false;
        const itemTagIds = item.tags.map((tag) => tag.id);
        return selectedTags.some((tagId) => itemTagIds.includes(tagId));
      });
    }

    // Sort by date DESC (most recent first)
    return result.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [items, selectedFilter, selectedTags, dateFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = filteredItems.length;

    const totalAmount = filteredItems.reduce((sum, item) => {
      if (isExpense(item) && item.amount !== undefined && item.amount !== null) {
        return sum + item.amount;
      }
      return sum;
    }, 0);

    return { totalItems, totalAmount };
  }, [filteredItems]);

  // Determine if advanced filters (date/tag) are active
  const hasAdvancedFilters = dateFilter.type !== 'all' || selectedTags.length > 0;

  const getDateFilterLabel = (): string => {
    switch (dateFilter.type) {
      case 'this_month':
        return '이번 달';
      case 'last_month':
        return '지난 달';
      case 'last_3_months':
        return '최근 3개월';
      case 'custom':
        if (dateFilter.from != null && dateFilter.to != null) {
          return `${dateFilter.from.toISOString().slice(0, 7)} ~ ${dateFilter.to.toISOString().slice(0, 7)}`;
        }
        return '사용자 지정';
      default:
        return '';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  const handleAddItem = () => {
    setShowAddModal(true);
  };

  const handleCreateItem = async (data: CreateItemInput) => {
    setIsSubmitting(true);
    try {
      const { tags: tagIds, customValues, ...itemData } = data;

      const item = await createItem(itemData);

      if (tagIds && tagIds.length > 0) {
        await setTagsForItem(item.id, tagIds);
      }

      if (customValues && Object.keys(customValues).length > 0) {
        await setItemCustomValues(item.id, customValues);
      }

      await loadItems();
      setShowAddModal(false);
      Alert.alert('성공', '항목이 추가되었습니다.');
    } catch (error) {
      console.error('Failed to create item:', error);
      Alert.alert('오류', '항목 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedFilter('all');
    setSelectedTags([]);
    setDateFilter({ type: 'this_month' });
  };

  const handleFilterSheetApply = ({ dateFilter: df, selectedTags: st }: FilterState) => {
    setDateFilter(df);
    setSelectedTags(st);
    setShowFilterSheet(false);
  };

  const renderHeader = () => (
    <View className="mb-2">
      {/* Filter Bar: classification chips + filter button */}
      <View className="flex-row items-center mb-2">
        <FlatList
          data={FILTER_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <SelectableChip
              label={item.name}
              isSelected={selectedFilter === item.id}
              onPress={() => handleFilterChange(item.id)}
            />
          )}
        />
        {/* Advanced filter button */}
        <TouchableOpacity
          onPress={() => setShowFilterSheet(true)}
          className="ml-2 p-2 rounded-full"
          style={{
            backgroundColor: hasAdvancedFilters ? '#3B82F6' : undefined,
          }}
          activeOpacity={0.7}
          accessibilityLabel="필터 열기"
          accessibilityRole="button"
        >
          <View className={hasAdvancedFilters ? '' : 'bg-gray-100 dark:bg-gray-700 rounded-full p-0.5'}>
            <Ionicons
              name="options-outline"
              size={20}
              color={hasAdvancedFilters ? '#FFFFFF' : iconColor}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Compact stats */}
      <View className="flex-row items-center mb-2">
        <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {stats.totalItems}건
        </Text>
        {stats.totalAmount > 0 && (
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {' · '}₩{stats.totalAmount.toLocaleString('ko-KR')}
          </Text>
        )}
      </View>

      {/* Active filter chips (only shown when filters are active) */}
      {hasAdvancedFilters && (
        <View className="flex-row flex-wrap gap-2 mb-2">
          {dateFilter.type !== 'all' && (
            <TouchableOpacity
              onPress={() => setDateFilter({ type: 'all' })}
              className="flex-row items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full"
              activeOpacity={0.7}
              accessibilityLabel={`${getDateFilterLabel()} 필터 제거`}
              accessibilityRole="button"
            >
              <Text className="text-xs text-blue-700 dark:text-blue-300 mr-1">
                {getDateFilterLabel()}
              </Text>
              <Ionicons name="close" size={12} color="#1D4ED8" />
            </TouchableOpacity>
          )}
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (tag == null) return null;
            return (
              <TouchableOpacity
                key={tagId}
                onPress={() => toggleTag(tagId)}
                className="flex-row items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                activeOpacity={0.7}
                accessibilityLabel={`${tag.name} 태그 제거`}
                accessibilityRole="button"
              >
                <Text className="text-xs text-gray-700 dark:text-gray-300 mr-1">
                  #{tag.name}
                </Text>
                <Ionicons name="close" size={12} color="#6B7280" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => {
    const hasActiveFilters =
      selectedFilter !== 'all' || selectedTags.length > 0 || dateFilter.type !== 'all';

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

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ItemCard item={item} />
  ), []);

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-500 dark:text-gray-400">항목 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <>
      <Header title="증빙" />
      <TabScreenContent
        floatingActions={[
          {
            icon: 'add',
            onPress: handleAddItem,
            variant: 'primary',
          },
        ]}
      >
        <FlatList
          className="flex-1 bg-white dark:bg-gray-900"
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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

        {showAddModal && (
          <ItemForm
            onSubmit={handleCreateItem}
            onCancel={() => setShowAddModal(false)}
          />
        )}

        <ItemsFilterSheet
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          onApply={handleFilterSheetApply}
          currentFilters={{ dateFilter, selectedTags }}
          tags={tags}
        />
      </TabScreenContent>
    </>
  );
}
