import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header } from '@/components/common';
import { ItemForm } from '@/components/item';
import { TabScreenContent } from '@/design-system/layouts';
import { useItemStore } from '@/store/itemStore';
import { createItem } from '@/services/database/itemService';
import { setTagsForItem } from '@/services/database/tagService';
import { setItemCustomValues } from '@/services/database/customFieldService';
import { isExpense } from '@/types/item';
import { CLASSIFICATIONS } from '@/constants/items';
import type { CreateItemInput } from '@/types';

export default function HomeScreen() {
  const { items, isLoading, loadItems, loadItemsIfStale } = useItemStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load items when screen is focused (30초 staleness 캐시)
  useFocusEffect(
    useCallback(() => {
      loadItemsIfStale();
    }, [loadItemsIfStale])
  );

  const handleAddItem = () => {
    setShowAddModal(true);
  };

  const handleCreateItem = async (data: CreateItemInput) => {
    setIsSubmitting(true);
    try {
      // Separate tags and customValues from item data
      const { tags: tagIds, customValues, ...itemData } = data;

      // Create item in database
      const item = await createItem(itemData);

      // Save tags if provided
      if (tagIds && tagIds.length > 0) {
        await setTagsForItem(item.id, tagIds);
      }

      // Save custom field values if provided
      if (customValues && Object.keys(customValues).length > 0) {
        await setItemCustomValues(item.id, customValues);
      }

      await loadItems(); // Refresh the list
      setShowAddModal(false);
      Alert.alert('성공', '항목이 추가되었습니다.');
    } catch (error) {
      console.error('Failed to create item:', error);
      Alert.alert('오류', '항목 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Filter items for current month
    const thisMonthItems = items.filter(item => item.date.startsWith(currentMonth));

    // Calculate total amount (only expense items: personal_card, corporate_card)
    const totalAmount = thisMonthItems
      .filter(item => isExpense(item))
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    // Count by classification
    const personalCardItems = thisMonthItems.filter(item => item.classification === 'personal_card');
    const corporateCardItems = thisMonthItems.filter(item => item.classification === 'corporate_card');
    const proofDocumentItems = thisMonthItems.filter(item => item.classification === 'proof_document');

    // Calculate amounts by classification
    const personalCardTotal = personalCardItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const corporateCardTotal = corporateCardItems.reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
      totalAmount,
      totalCount: thisMonthItems.length,
      personalCard: {
        count: personalCardItems.length,
        total: personalCardTotal,
      },
      corporateCard: {
        count: corporateCardItems.length,
        total: corporateCardTotal,
      },
      proofDocument: {
        count: proofDocumentItems.length,
      },
    };
  }, [items]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <>
      <Header title="대시보드" />
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
                이번 달 지출
              </Text>
            </View>

            <View className="mb-4">
              {isLoading && items.length === 0 ? (
                <ActivityIndicator size="large" color="#2563eb" />
              ) : (
                <Text className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(stats.totalAmount)}
                </Text>
              )}
            </View>

            <View className="flex-row items-center">
              <Ionicons name="list-outline" size={16} color="#6b7280" />
              <Text className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                증빙 {stats.totalCount}건
              </Text>
            </View>
          </Card>
        </View>

        {/* Quick Action Cards */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            분류별 현황
          </Text>

          <View className="gap-3">
            {/* Render classification cards in order from CLASSIFICATIONS */}
            {CLASSIFICATIONS.map((classification) => {
              // Map snake_case to camelCase for stats object
              const statsKeyMap: Record<string, 'personalCard' | 'corporateCard' | 'proofDocument'> = {
                'personal_card': 'personalCard',
                'corporate_card': 'corporateCard',
                'proof_document': 'proofDocument',
              };
              const statsKey = statsKeyMap[classification.id];
              const stat = stats[statsKey];
              const count = stat.count;
              const total = 'total' in stat ? stat.total : undefined;

              return (
                <TouchableOpacity
                  key={classification.id}
                  onPress={() => router.push(`/(tabs)/items?classification=${classification.id}`)}
                  activeOpacity={0.7}
                >
                  <Card>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="rounded-full p-3 mr-3"
                          style={{ backgroundColor: `${classification.color}20` }}
                        >
                          <Ionicons
                            name={classification.icon as React.ComponentProps<typeof Ionicons>['name']}
                            size={24}
                            color={classification.color}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {classification.name}
                          </Text>
                          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {count}건{total !== undefined ? ` · ${formatCurrency(total)}` : ''}
                          </Text>
                        </View>
                      </View>
                      {count > 0 && (
                        <View
                          className="rounded-full px-3 py-1"
                          style={{ backgroundColor: classification.color }}
                        >
                          <Text className="text-white text-xs font-semibold">
                            {count}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}

          </View>
        </View>

        {/* Empty State - Only show when no items */}
        {!isLoading && items.length === 0 && (
          <View className="px-6 pb-6">
            <Card>
              <View className="items-center py-8">
                <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 mb-4">
                  <Ionicons name="list-outline" size={48} color="#9ca3af" />
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
