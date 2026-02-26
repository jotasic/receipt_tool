import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import * as Sharing from 'expo-sharing';
import { FloatingActionBar } from '@/components/common';
import type { ClassificationDisplayData } from '@/components/common';
import { ItemCard } from '@/components/item/ItemCard';
import type { Item } from '@/types/item';
import type { Classification } from '@/types/space';
import {
  getMonthlyItems,
  exportMonthlySettlement,
} from '@/services/export';
import { getActiveClassificationsBySpace } from '@/services/database/classificationService';
import { useSpaceStore } from '@/store/spaceStore';

// ============================================================================
// Per-classification summary bucket
// ============================================================================

interface ClassificationSummaryBucket {
  classificationId: string | null;
  name: string;
  color: string | null | undefined;
  icon: string | null | undefined;
  count: number;
  totalAmount: number;
}

function buildClassificationSummary(
  items: Item[],
  classifications: Classification[]
): { buckets: ClassificationSummaryBucket[]; total: { count: number; totalAmount: number } } {
  // Build a lookup map from classificationId -> Classification
  const classificationMap = new Map<string, Classification>(
    classifications.map((c) => [c.id, c])
  );

  // Accumulate per-classification
  const bucketMap = new Map<string | null, ClassificationSummaryBucket>();

  for (const item of items) {
    const key = item.classificationId ?? null;
    const existing = bucketMap.get(key);
    const amount = item.amount ?? 0;

    if (existing) {
      existing.count += 1;
      existing.totalAmount += amount;
    } else {
      let name: string;
      let color: string | null | undefined;
      let icon: string | null | undefined;

      if (key !== null) {
        const cls = classificationMap.get(key);
        name = cls?.name ?? '알 수 없는 분류';
        color = cls?.color;
        icon = cls?.icon;
      } else {
        name = '분류 없음';
        color = null;
        icon = null;
      }

      bucketMap.set(key, {
        classificationId: key,
        name,
        color,
        icon,
        count: 1,
        totalAmount: amount,
      });
    }
  }

  // Sort: known classifications first (by their displayOrder), then null last
  const buckets = Array.from(bucketMap.values()).sort((a, b) => {
    if (a.classificationId === null) return 1;
    if (b.classificationId === null) return -1;

    const aOrder = classificationMap.get(a.classificationId)?.displayOrder ?? 999;
    const bOrder = classificationMap.get(b.classificationId)?.displayOrder ?? 999;
    return aOrder - bOrder;
  });

  const total = items.reduce(
    (acc, item) => ({
      count: acc.count + 1,
      totalAmount: acc.totalAmount + (item.amount ?? 0),
    }),
    { count: 0, totalAmount: 0 }
  );

  return { buckets, total };
}

// ============================================================================
// SummaryCard
// ============================================================================

interface SummaryCardProps {
  buckets: ClassificationSummaryBucket[];
  total: { count: number; totalAmount: number };
}

function SummaryCard({ buckets, total }: SummaryCardProps) {
  const fallbackDotColor = useThemeColor('#9CA3AF', '#6B7280');

  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700">
      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        월별 요약
      </Text>

      {buckets.map((bucket, index) => (
        <View
          key={bucket.classificationId ?? '__unclassified__'}
          className={`flex-row justify-between items-center py-2 ${
            index < buckets.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
          }`}
        >
          <View className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: bucket.color ?? fallbackDotColor }}
            />
            <Text className="text-sm text-gray-700 dark:text-gray-300">{bucket.name}</Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-bold text-gray-900 dark:text-gray-100">
              {bucket.totalAmount.toLocaleString('ko-KR')}원
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {bucket.count}건
            </Text>
          </View>
        </View>
      ))}

      {/* Total */}
      <View className="flex-row justify-between items-center pt-3 mt-1">
        <Text className="text-base font-bold text-gray-900 dark:text-gray-100">합계</Text>
        <View className="items-end">
          <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {total.totalAmount.toLocaleString('ko-KR')}원
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            총 {total.count}건
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// EmptyState
// ============================================================================

function EmptyState({ year, month }: { year: string; month: string }) {
  const emptyIconColor = useThemeColor('#9CA3AF', '#6B7280');

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="receipt-outline" size={64} color={emptyIconColor} />
      <Text className="text-lg font-semibold mt-4 text-gray-900 dark:text-gray-100">
        {year}년 {month}월에 항목이 없습니다
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
        항목을 추가하면 여기에 표시됩니다
      </Text>
    </View>
  );
}

// ============================================================================
// NoSpaceState
// ============================================================================

function NoSpaceState() {
  const iconColor = useThemeColor('#9CA3AF', '#6B7280');

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="folder-open-outline" size={64} color={iconColor} />
      <Text className="text-lg font-semibold mt-4 text-gray-900 dark:text-gray-100">
        스페이스를 선택해 주세요
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
        리포트를 보려면 먼저 스페이스를 선택해야 합니다
      </Text>
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

interface Props {
  year: string;
  month: string;
}

export function MonthlyReportScreen({ year, month }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const refreshTintColor = useThemeColor('#3B82F6', '#60A5FA');
  const { currentSpace } = useSpaceStore();

  const handleExport = useCallback(async () => {
    if (!year || !month) return;

    setIsExporting(true);
    try {
      const result = await exportMonthlySettlement(
        parseInt(year),
        parseInt(month),
        currentSpace?.id
      );

      if (result.success && result.filePath) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.filePath, {
            mimeType: 'application/zip',
            dialogTitle: '정산 파일 공유',
          });
        } else {
          Alert.alert('성공', '정산 파일이 생성되었습니다.');
        }
      } else {
        Alert.alert('오류', result.error ?? '파일 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('오류', '파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  }, [year, month, currentSpace?.id]);

  const loadMonthlyData = useCallback(async () => {
    if (!year || !month || !currentSpace) return;

    setIsLoading(true);
    try {
      const [monthlyItems, activeClassifications] = await Promise.all([
        getMonthlyItems(parseInt(year), parseInt(month), currentSpace.id),
        getActiveClassificationsBySpace(currentSpace.id),
      ]);

      setItems(monthlyItems);
      setClassifications(activeClassifications);
    } catch (error) {
      console.error('Failed to load monthly data:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [year, month, currentSpace]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  const classificationMap = useMemo(() => {
    const map: Record<string, ClassificationDisplayData> = {};
    classifications.forEach((c) => {
      map[c.id] = { name: c.name, icon: c.icon, color: c.color };
    });
    return map;
  }, [classifications]);

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ItemCard
      item={item}
      classificationData={item.classificationId ? classificationMap[item.classificationId] : undefined}
    />
  ), [classificationMap]);

  if (!currentSpace) {
    return <NoSpaceState />;
  }

  const { buckets, total } = buildClassificationSummary(items, classifications);
  const hasSummary = items.length > 0;

  return (
    <>
      <FlatList
        className="flex-1 bg-white dark:bg-gray-900"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {isLoading && (
              <View className="py-4 items-center">
                <ActivityIndicator color={refreshTintColor} />
              </View>
            )}
            {hasSummary && !isLoading && (
              <SummaryCard buckets={buckets} total={total} />
            )}
            {items.length > 0 && (
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                항목 목록
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading ? <EmptyState year={year} month={month} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadMonthlyData}
            tintColor={refreshTintColor}
          />
        }
      />

      {/* Floating Action Bar - Export */}
      <FloatingActionBar
        actions={[
          {
            icon: 'download-outline',
            onPress: handleExport,
            loading: isExporting,
            disabled: isExporting,
            variant: 'primary',
          },
        ]}
      />
    </>
  );
}
