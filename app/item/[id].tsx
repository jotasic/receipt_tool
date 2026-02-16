import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Button, ClassificationBadge, UsagePurposeBadge, TagBadge } from '@/components/common';
import { ScreenLayout } from '@/design-system/layouts';
import { useItemStore } from '@/store/itemStore';
import { getItemById, deleteItem } from '@/services/database/itemService';
import { getTagsForItem } from '@/services/database/tagService';
import { getItemCustomValues } from '@/services/database/customFieldService';
import { getClassificationConfig } from '@/constants/items';
import type { Item } from '@/types/item';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteItemFromStore = useItemStore((state) => state.deleteItem);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    if (!id) {
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const fetchedItem = await getItemById(id);

      if (!fetchedItem) {
        Alert.alert('오류', '항목을 찾을 수 없습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
        return;
      }

      // Load tags for the item
      const tags = await getTagsForItem(id);

      // Load custom values for the item
      const customValues = await getItemCustomValues(id);

      setItem({ ...fetchedItem, tags, customValues });
    } catch (error) {
      console.error('Item load error:', error);
      Alert.alert('오류', '항목을 불러오는 중 오류가 발생했습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '항목 삭제',
      '이 항목을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!id || !item) return;

    try {
      setIsDeleting(true);

      // Delete image file if exists
      if (item.filePath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(item.filePath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(item.filePath);
          }
        } catch (fileError) {
          console.error('File delete error:', fileError);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete from database
      await deleteItem(id);

      // Update store
      deleteItemFromStore(id);

      Alert.alert('삭제 완료', '항목이 삭제되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Item delete error:', error);
      Alert.alert('삭제 실패', '항목 삭제 중 오류가 발생했습니다.', [
        { text: '확인' },
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!id) return;
    router.push(`/item/edit?id=${id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenLayout title="항목 상세" showHeader showBack>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-4 text-gray-500">항목 불러오는 중...</Text>
          </View>
        </ScreenLayout>
      </>
    );
  }

  if (!item) {
    return null;
  }

  const classificationConfig = getClassificationConfig(item.classification);
  const createdDate = new Date(item.createdAt);
  const updatedDate = new Date(item.updatedAt);

  if (!classificationConfig) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout title="항목 상세" showHeader showBack scrollable={false}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
        {/* Item Image */}
        {item.filePath && (
          <View className="mb-6">
            <View
              className="w-full rounded-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Image
                source={{ uri: item.filePath }}
                className="w-full h-64 rounded-lg bg-gray-100"
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* Classification and Usage Purpose Badges */}
        <View className="mb-4 flex-row gap-2 flex-wrap">
          <ClassificationBadge classification={item.classification} variant="large" />
          <UsagePurposeBadge usagePurpose={item.usagePurpose} variant="large" />
        </View>

        {/* Title */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {item.title}
          </Text>
        </View>

        {/* Tags Section */}
        {item.tags && item.tags.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">태그</Text>
            <View className="flex-row flex-wrap gap-2">
              {item.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </View>
          </View>
        )}

        {/* Custom Fields Section */}
        {item.customValues && item.customValues.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">추가 정보</Text>
            <View className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {item.customValues.map((cv) => (
                <View key={cv.fieldId} className="mb-3 last:mb-0">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{cv.fieldName}</Text>
                  <Text className="text-sm text-gray-900 dark:text-gray-100">{cv.value || '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Item Details */}
        <View className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Amount */}
          {item.amount !== undefined && (
            <View className="mb-3">
              <View className="flex-row items-center mb-1">
                <Ionicons name="cash-outline" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">
                  금액
                </Text>
              </View>
              <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 ml-6">
                {formatCurrency(item.amount)}
              </Text>
            </View>
          )}

          {/* Store Name */}
          {item.storeName && (
            <View className="mb-3">
              <View className="flex-row items-center mb-1">
                <Ionicons name="storefront-outline" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">
                  가맹점
                </Text>
              </View>
              <Text className="text-base text-gray-900 dark:text-gray-100 ml-6">
                {item.storeName}
              </Text>
            </View>
          )}

          {/* Date */}
          <View>
            <View className="flex-row items-center mb-1">
              <Ionicons name="calendar-outline" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">
                일자
              </Text>
            </View>
            <Text className="text-base text-gray-900 dark:text-gray-100 ml-6">
              {formatDate(item.date)}
            </Text>
          </View>
        </View>

        {/* Memo */}
        {item.memo && (
          <View className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <View className="flex-row items-center mb-2">
              <Ionicons name="document-text-outline" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 ml-2">
                메모
              </Text>
            </View>
            <Text className="text-base text-gray-600 dark:text-gray-400 leading-6">
              {item.memo}
            </Text>
          </View>
        )}

        {/* Metadata */}
        <View className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              생성일: {formatDateTime(item.createdAt)}
            </Text>
          </View>

          {item.createdAt !== item.updatedAt && (
            <View className="flex-row items-center">
              <Ionicons name="sync-outline" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                수정일: {formatDateTime(item.updatedAt)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 border-t border-gray-200 dark:border-gray-700">
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Button
              title="편집"
              onPress={handleEdit}
              variant="outline"
              disabled={isDeleting}
              icon={<Ionicons name="create-outline" size={20} color="#2563eb" />}
            />
          </View>
          <View className="flex-1">
            <Button
              title={isDeleting ? '삭제 중...' : '삭제'}
              onPress={handleDelete}
              variant="outline"
              disabled={isDeleting}
              loading={isDeleting}
              icon={
                !isDeleting ? (
                  <Ionicons name="trash-outline" size={20} color="#2563eb" />
                ) : undefined
              }
            />
          </View>
        </View>
      </View>
      </ScreenLayout>
    </>
  );
}
