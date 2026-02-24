import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
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
import { useSpaceStore } from '@/store/spaceStore';
import { getActiveClassificationsBySpace } from '@/services/database/classificationService';
import type { Classification } from '@/types/space';
import type { Item, Tag, CreateItemInput } from '@/types';
import { isExpense } from '@/types/item';
import { getTags, setTagsForItem } from '@/services/database/tagService';
import { createItem } from '@/services/database/itemService';
import { setItemCustomValues } from '@/services/database/customFieldService';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';

// 분류 필터 타입: 'all' 또는 classificationId (string)
type FilterType = 'all' | string;

export default function ItemsScreen() {
  const { items, isLoading, loadItems, loadItemsIfStale } = useItemStore();
  const { currentSpace } = useSpaceStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'this_month' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const iconColor = useThemeColor('#374151', '#D1D5DB');
  const filterChipCloseColor = useThemeColor('#1D4ED8', '#93C5FD');
  const tagCloseColor = useThemeColor('#6B7280', '#9CA3AF');
  const emptyIconColor = useThemeColor('#9CA3AF', '#6B7280');
  const loadingColor = useThemeColor('#2563EB', '#60A5FA');
  const filterActiveBg = useThemeColor('#3B82F6', '#60A5FA');
  const filterActiveIcon = useThemeColor('#FFFFFF', '#FFFFFF');

  // URL 파라미터
  const params = useLocalSearchParams<{ classificationId?: string }>();

  // 포커스마다 항목 + 분류 재로드
  useFocusEffect(
    useCallback(() => {
      loadItemsIfStale(currentSpace?.id ?? null);
      if (currentSpace) {
        loadClassifications(currentSpace.id);
      }
    }, [loadItemsIfStale, currentSpace])
  );

  // 태그 로드 (currentSpace 변경 시 재로드)
  useEffect(() => {
    loadAllTags();
  }, [currentSpace?.id]);

  // URL 파라미터로 필터 초기 설정
  useEffect(() => {
    if (params.classificationId) {
      setSelectedFilter(params.classificationId);
      router.replace('/(tabs)/items');
    }
  }, [params.classificationId]);

  // currentSpace 변경 시 필터 초기화
  useEffect(() => {
    setSelectedFilter('all');
  }, [currentSpace?.id]);

  const loadClassifications = async (spaceId: string) => {
    try {
      const list = await getActiveClassificationsBySpace(spaceId);
      setClassifications(list);
    } catch (error) {
      console.error('Failed to load classifications:', error);
    }
  };

  const loadAllTags = async () => {
    try {
      const allTags = await getTags(currentSpace?.id);
      setTags(allTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  // 필터링된 항목 목록
  const filteredItems = useMemo(() => {
    let result = items;

    // 현재 공간 기준 필터
    if (currentSpace) {
      result = result.filter((item) => item.spaceId === currentSpace.id);
    }

    // 날짜 필터
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

    // 분류 필터 (classificationId 기반)
    if (selectedFilter !== 'all') {
      result = result.filter((item) => item.classificationId === selectedFilter);
    }

    // 태그 필터
    if (selectedTags.length > 0) {
      result = result.filter((item) => {
        if (!item.tags || item.tags.length === 0) return false;
        const itemTagIds = item.tags.map((tag) => tag.id);
        return selectedTags.some((tagId) => itemTagIds.includes(tagId));
      });
    }

    // 날짜 내림차순 정렬
    return result.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [items, currentSpace, selectedFilter, selectedTags, dateFilter]);

  // 통계
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
    await loadItems(currentSpace?.id ?? null);
    setIsRefreshing(false);
  };

  const handleCreateItem = async (data: CreateItemInput) => {
    try {
      const { tags: tagIds, customValues, ...itemData } = data;

      const item = await createItem(itemData);

      if (tagIds && tagIds.length > 0) {
        await setTagsForItem(item.id, tagIds);
      }

      if (customValues && Object.keys(customValues).length > 0) {
        await setItemCustomValues(item.id, customValues);
      }

      await loadItems(currentSpace?.id ?? null);
      setShowAddModal(false);
      Alert.alert('성공', '항목이 추가되었습니다.');
    } catch (error) {
      console.error('Failed to create item:', error);
      Alert.alert('오류', '항목 추가에 실패했습니다.');
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = useCallback(() => {
    setSelectedFilter('all');
    setSelectedTags([]);
    setDateFilter({ type: 'this_month' });
  }, []);

  const handleFilterSheetApply = ({ dateFilter: df, selectedTags: st }: FilterState) => {
    setDateFilter(df);
    setSelectedTags(st);
    setShowFilterSheet(false);
  };

  // 필터 칩 데이터: '전체' + 분류 목록
  const filterOptions = useMemo<Array<{ id: FilterType; name: string; icon: string }>>(() => {
    return [
      { id: 'all', name: '전체', icon: 'apps' },
      ...classifications.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon ?? 'folder-outline',
      })),
    ];
  }, [classifications]);

  const renderHeader = useCallback(() => (
    <View className="mb-2">
      {/* 분류 필터 칩 + 고급 필터 버튼 */}
      <View className="flex-row items-center mb-2">
        <FlatList
          data={filterOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <SelectableChip
              label={item.name}
              isSelected={selectedFilter === item.id}
              onPress={() => setSelectedFilter(item.id)}
            />
          )}
        />
        <Pressable
          onPress={() => setShowFilterSheet(true)}
          className="ml-2 p-2 rounded-full"
          style={{
            backgroundColor: hasAdvancedFilters ? filterActiveBg : undefined,
          }}
          accessibilityLabel="필터 열기"
          accessibilityRole="button"
        >
          <View
            className={
              hasAdvancedFilters ? '' : 'bg-gray-100 dark:bg-gray-700 rounded-full p-0.5'
            }
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={hasAdvancedFilters ? filterActiveIcon : iconColor}
            />
          </View>
        </Pressable>
      </View>

      {/* 통계 */}
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

      {/* 활성 필터 칩 */}
      {hasAdvancedFilters && (
        <View className="flex-row flex-wrap gap-2 mb-2">
          {dateFilter.type !== 'all' && (
            <Pressable
              onPress={() => setDateFilter({ type: 'all' })}
              className="flex-row items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full"
              accessibilityLabel={`${getDateFilterLabel()} 필터 제거`}
              accessibilityRole="button"
            >
              <Text className="text-xs text-blue-700 dark:text-blue-300 mr-1">
                {getDateFilterLabel()}
              </Text>
              <Ionicons name="close" size={12} color={filterChipCloseColor} />
            </Pressable>
          )}
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (tag == null) return null;
            return (
              <Pressable
                key={tagId}
                onPress={() => toggleTag(tagId)}
                className="flex-row items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                accessibilityLabel={`${tag.name} 태그 제거`}
                accessibilityRole="button"
              >
                <Text className="text-xs text-gray-700 dark:text-gray-300 mr-1">
                  #{tag.name}
                </Text>
                <Ionicons name="close" size={12} color={tagCloseColor} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [stats, selectedFilter, hasAdvancedFilters, dateFilter, selectedTags, tags, iconColor, filterOptions]);

  const renderEmptyState = useCallback(() => {
    const hasActiveFilters =
      selectedFilter !== 'all' || selectedTags.length > 0 || dateFilter.type !== 'all';

    return (
      <View className="items-center justify-center py-16">
        <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
          <Ionicons name="receipt-outline" size={64} color={emptyIconColor} />
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
          <Pressable
            onPress={clearFilters}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
            accessibilityLabel="필터 초기화"
            accessibilityRole="button"
          >
            <Text className="text-blue-600 dark:text-blue-400 font-medium">필터 초기화</Text>
          </Pressable>
        )}
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, selectedTags, dateFilter, clearFilters]);

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ItemCard item={item} />
  ), []);

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color={loadingColor} />
        <Text className="mt-4 text-gray-500 dark:text-gray-400">항목 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <>
      <Header title="증빙" showSpaceIcon />
      <TabScreenContent
        floatingActions={[
          {
            icon: 'add',
            onPress: () => setShowAddModal(true),
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
              colors={[loadingColor]}
              tintColor={loadingColor}
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
