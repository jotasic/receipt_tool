import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header } from '@/components/common';
import { useItemStore } from '@/store/itemStore';
import { isExpense } from '@/types/item';
import { useCallback, useMemo } from 'react';

export default function HomeScreen() {
  const { items, isLoading, loadItems } = useItemStore();

  // Load items when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const handleAddItem = () => {
    router.push('/item/add' as any);
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
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Header title="대시보드" />

      <ScrollView
        className="flex-1"
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
            {/* Personal Card */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/items?classification=personal_card')}
              activeOpacity={0.7}
            >
              <Card>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mr-3">
                      <Ionicons name="card-outline" size={24} color="#2563eb" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        개인카드
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {stats.personalCard.count}건 · {formatCurrency(stats.personalCard.total)}
                      </Text>
                    </View>
                  </View>
                  {stats.personalCard.count > 0 && (
                    <View className="bg-blue-600 rounded-full px-3 py-1">
                      <Text className="text-white text-xs font-semibold">
                        {stats.personalCard.count}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>

            {/* Corporate Card */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/items?classification=corporate_card')}
              activeOpacity={0.7}
            >
              <Card>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-3 mr-3">
                      <Ionicons name="business-outline" size={24} color="#7c3aed" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        법인카드
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {stats.corporateCard.count}건 · {formatCurrency(stats.corporateCard.total)}
                      </Text>
                    </View>
                  </View>
                  {stats.corporateCard.count > 0 && (
                    <View className="bg-purple-600 rounded-full px-3 py-1">
                      <Text className="text-white text-xs font-semibold">
                        {stats.corporateCard.count}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>

            {/* Proof Document */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/items?classification=proof_document')}
              activeOpacity={0.7}
            >
              <Card>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 mr-3">
                      <Ionicons name="document-text-outline" size={24} color="#059669" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        증명서류
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {stats.proofDocument.count}건
                      </Text>
                    </View>
                  </View>
                  {stats.proofDocument.count > 0 && (
                    <View className="bg-green-600 rounded-full px-3 py-1">
                      <Text className="text-white text-xs font-semibold">
                        {stats.proofDocument.count}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/reports')}
              activeOpacity={0.7}
            >
              <Card>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-3 mr-3">
                      <Ionicons name="stats-chart-outline" size={24} color="#ea580c" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        리포트
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        지출 분석 및 통계
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </Card>
            </TouchableOpacity>
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
                <Text className="text-gray-400 dark:text-gray-500 text-sm text-center mt-2">
                  하단의 + 버튼을 눌러 증빙을 추가해보세요
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

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
        accessibilityLabel="증빙 추가"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
