import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header } from '@/components/common';
import { ItemForm } from '@/components/item';
import { TabScreenContent } from '@/design-system/layouts';
import { useItemStore } from '@/store/itemStore';
import { useSpaceStore } from '@/store/spaceStore';
import { createItem } from '@/services/database/itemService';
import { setTagsForItem } from '@/services/database/tagService';
import { setItemCustomValues } from '@/services/database/customFieldService';
import { getActiveClassificationsBySpace } from '@/services/database/classificationService';
import { isExpense } from '@/types/item';
import type { Classification } from '@/types/space';
import type { CreateItemInput } from '@/types';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';

export default function HomeScreen() {
  const { items, isLoading, loadItems, loadItemsIfStale } = useItemStore();
  const { currentSpace } = useSpaceStore();
  const loadingColor = useThemeColor('#2563EB', '#60A5FA');
  const secondaryIconColor = useThemeColor('#6B7280', '#9CA3AF');
  const emptyIconColor = useThemeColor('#9CA3AF', '#6B7280');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classifications, setClassifications] = useState<Classification[]>([]);

  // 포커스마다 항목 + 분류 재로드
  useFocusEffect(
    useCallback(() => {
      loadItemsIfStale();
      if (currentSpace) {
        loadClassifications(currentSpace.id);
      }
    }, [loadItemsIfStale, currentSpace])
  );

  const loadClassifications = async (spaceId: string) => {
    try {
      const list = await getActiveClassificationsBySpace(spaceId);
      setClassifications(list);
    } catch (error) {
      console.error('Failed to load classifications:', error);
    }
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

  // 이번 달 통계 (현재 공간 기준)
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const thisMonthItems = items.filter((item) => {
      const matchesMonth = item.date.startsWith(currentMonth);
      const matchesSpace = currentSpace ? item.spaceId === currentSpace.id : true;
      return matchesMonth && matchesSpace;
    });

    const totalAmount = thisMonthItems
      .filter((item) => isExpense(item))
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    // classificationId 기준으로 집계
    const byClassification: Record<string, { count: number; total: number }> = {};
    for (const item of thisMonthItems) {
      const key = item.classificationId ?? '__legacy__';
      if (!byClassification[key]) {
        byClassification[key] = { count: 0, total: 0 };
      }
      byClassification[key].count += 1;
      byClassification[key].total += item.amount ?? 0;
    }

    return {
      totalAmount,
      totalCount: thisMonthItems.length,
      byClassification,
    };
  }, [items, currentSpace]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <>
      <Header title="대시보드" showSpaceIcon />
      <TabScreenContent>
        <ScrollView
          className="flex-1 bg-white dark:bg-gray-900"
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadItems} />
          }
        >
          {/* Monthly Expense Summary Card */}
          <View className="px-6 pt-4 pb-6">
            <Card className="bg-gradient-to-br">
              <View className="mb-2">
                <Text className="text-gray-600 dark:text-gray-400 text-base font-medium">
                  {currentSpace ? `${currentSpace.name} · ` : ''}이번 달 지출
                </Text>
              </View>

              <View className="mb-4">
                {isLoading && items.length === 0 ? (
                  <ActivityIndicator size="large" color={loadingColor} />
                ) : (
                  <Text className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(stats.totalAmount)}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center">
                <Ionicons name="list-outline" size={16} color={secondaryIconColor} />
                <Text className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                  증빙 {stats.totalCount}건
                </Text>
              </View>
            </Card>
          </View>

          {/* Classification Cards */}
          <View className="px-6 pb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              분류별 현황
            </Text>

            <View className="gap-3">
              {classifications.length === 0 ? (
                <Card>
                  <View className="items-center py-6">
                    <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                      {currentSpace
                        ? '이 공간에 등록된 분류가 없습니다.\n설정에서 분류를 추가해주세요.'
                        : '공간을 선택해주세요.'}
                    </Text>
                  </View>
                </Card>
              ) : (
                classifications.map((classification) => {
                  const stat = stats.byClassification[classification.id] ?? {
                    count: 0,
                    total: 0,
                  };
                  const color = classification.color ?? '#6B7280';
                  const iconName = classification.icon ?? 'folder-outline';

                  return (
                    <Pressable
                      key={classification.id}
                      onPress={() =>
                        router.push(
                          `/(tabs)/items?classificationId=${classification.id}`
                        )
                      }
                    >
                      <Card>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View
                              className="rounded-full p-3 mr-3"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              {/^[a-z0-9-]+$/.test(iconName) ? (
                                <Ionicons
                                  name={iconName as React.ComponentProps<typeof Ionicons>['name']}
                                  size={24}
                                  color={color}
                                />
                              ) : (
                                <Text style={{ fontSize: 22 }}>{iconName}</Text>
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {classification.name}
                              </Text>
                              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {stat.count}건
                                {stat.total > 0
                                  ? ` · ${formatCurrency(stat.total)}`
                                  : ''}
                              </Text>
                            </View>
                          </View>
                          {stat.count > 0 && (
                            <View
                              className="rounded-full px-3 py-1"
                              style={{ backgroundColor: color }}
                            >
                              <Text className="text-white text-xs font-semibold">
                                {stat.count}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Card>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>

          {/* Empty State */}
          {!isLoading && items.length === 0 && (
            <View className="px-6 pb-6">
              <Card>
                <View className="items-center py-8">
                  <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 mb-4">
                    <Ionicons name="list-outline" size={48} color={emptyIconColor} />
                  </View>
                  <Text className="text-gray-500 dark:text-gray-400 text-base text-center">
                    아직 등록된 증빙이 없습니다
                  </Text>
                </View>
              </Card>
            </View>
          )}
        </ScrollView>

        {showAddModal && (
          <ItemForm
            onSubmit={handleCreateItem}
            onCancel={() => setShowAddModal(false)}
          />
        )}
      </TabScreenContent>
    </>
  );
}
