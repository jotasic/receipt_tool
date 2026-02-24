import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { ClassificationBadge, UsagePurposeBadge, TagBadge, FloatingActionBar, Header, ImageZoomModal } from '@/components/common';
import { ItemForm, SpaceMoveSheet } from '@/components/item';
import { useItemStore } from '@/store/itemStore';
import { useSpaceStore } from '@/store/spaceStore';
import { getItemById, updateItem, deleteItem, moveItemToSpace } from '@/services/database/itemService';
import { getTagsForItem, setTagsForItem } from '@/services/database/tagService';
import { getItemCustomValues, setItemCustomValues } from '@/services/database/customFieldService';
import { getClassificationConfig } from '@/constants/items';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import type { Item, CreateItemInput } from '@/types/item';
import type { Space } from '@/types/space';

const ITEMS_IMAGES_DIR = FileSystem.documentDirectory + 'items/';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const updateItemInStore = useItemStore((state) => state.updateItem);
  const deleteItemFromStore = useItemStore((state) => state.deleteItem);
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const { spaces, currentSpace } = useSpaceStore();

  const loadingColor = useThemeColor('#2563EB', '#60A5FA');

  // Hide tab bar when this screen is focused.
  // Walk up the navigator tree to find the Tabs navigator, which is the
  // last ancestor before null. This works regardless of nesting depth
  // (index tab has 2 levels, items/calendar tabs have 3 levels).
  useEffect(() => {
    let tabsNavigator = navigation.getParent();
    let next = tabsNavigator?.getParent();
    while (next) {
      tabsNavigator = next;
      next = next.getParent();
    }

    if (tabsNavigator) {
      tabsNavigator.setOptions({ tabBarStyle: { display: 'none' } });
    }

    return () => {
      if (tabsNavigator) {
        tabsNavigator.setOptions({
          tabBarStyle: {
            paddingBottom: 8,
            paddingTop: 8,
            height: 68,
          },
        });
      }
    };
  }, [navigation]);

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
    if (!id || !item) return;

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
        }
      }

      await deleteItem(id);
      deleteItemFromStore(id);

      Alert.alert('삭제 완료', '항목이 삭제되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Item delete error:', error);
      Alert.alert('삭제 실패', '항목 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleMoveToSpace = async (targetSpace: Space) => {
    if (!id || !item) return;
    setIsMoving(true);
    try {
      await moveItemToSpace(id, targetSpace.id);
      deleteItemFromStore(id);
      setShowMoveSheet(false);
      Alert.alert('이동 완료', `'${targetSpace.name}' 워크스페이스로 이동되었습니다.`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Item move error:', error);
      Alert.alert('오류', '항목 이동에 실패했습니다.');
    } finally {
      setIsMoving(false);
    }
  };

  const handleUpdateItem = async (data: CreateItemInput) => {
    if (!id || !item) {
      Alert.alert('오류', '항목 정보를 찾을 수 없습니다.');
      return;
    }

    setIsSubmitting(true);
    const oldImagePath = item.filePath;
    const imageChanged = data.filePath !== oldImagePath;
    let newImagePath: string | null = null;

    try {
      // Handle image update if changed
      if (imageChanged && data.filePath) {
        // Save new image
        const dirInfo = await FileSystem.getInfoAsync(ITEMS_IMAGES_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(ITEMS_IMAGES_DIR, { intermediates: true });
        }
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        newImagePath = ITEMS_IMAGES_DIR + fileName;
        await FileSystem.copyAsync({ from: data.filePath, to: newImagePath });

        // Delete old image if exists
        if (oldImagePath) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(oldImagePath);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(oldImagePath);
            }
          } catch (error) {
            console.error('Failed to delete old image:', error);
          }
        }
      }

      // Prepare update data
      const updateData = {
        title: data.title,
        classification: data.classification,
        usagePurpose: data.usagePurpose,
        amount: data.amount,
        date: data.date,
        storeName: data.storeName,
        memo: data.memo,
        ocrText: data.ocrText,
        filePath: imageChanged ? newImagePath || undefined : oldImagePath,
        fileType: imageChanged ? data.fileType : item.fileType,
      };

      // Update in database
      await updateItem(id, updateData);

      // Save tags if provided
      if (data.tags !== undefined) {
        await setTagsForItem(id, data.tags);
      }

      // Save custom field values if provided
      if (data.customValues !== undefined) {
        await setItemCustomValues(id, data.customValues);
      }

      // Update Zustand store
      updateItemInStore(id, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      // Reload item to show updated data
      await loadItem();

      setShowEditModal(false);
      Alert.alert('성공', '항목이 수정되었습니다.');
    } catch (error) {
      console.error('Item update error:', error);

      // Cleanup new image on error
      if (newImagePath) {
        try {
          await FileSystem.deleteAsync(newImagePath, { idempotent: true });
        } catch (cleanupError) {
          console.error('Failed to cleanup new image:', cleanupError);
        }
      }

      Alert.alert('오류', '항목 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
        <Header title="항목 상세" showBack />
        <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
          <ActivityIndicator size="large" color={loadingColor} />
          <Text className="mt-4 text-gray-500 dark:text-gray-400">항목 불러오는 중...</Text>
        </View>
      </>
    );
  }

  if (!item) {
    return null;
  }

  const classificationConfig = getClassificationConfig(item.classification);

  if (!classificationConfig) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="항목 상세" showBack />
      <ScrollView className="flex-1 bg-white dark:bg-gray-900" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-4">
          {/* Item Image */}
          {item.filePath && (
            <View className="mb-6">
              <Pressable
                onPress={() => setShowImageModal(true)}
                accessibilityLabel="이미지 확대 보기"
                accessibilityRole="button"
              >
                <View
                  className="w-full rounded-lg overflow-hidden"
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
                    className="w-full h-64 bg-gray-100 dark:bg-gray-800"
                    resizeMode="contain"
                  />
                </View>
              </Pressable>
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
                    사용처
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
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      {item && (
        <FloatingActionBar
          actions={[
            {
              icon: 'trash-outline',
              onPress: handleDelete,
              disabled: isDeleting || isMoving,
              loading: isDeleting,
              variant: 'danger',
            },
            ...(spaces.length >= 2 ? [{
              icon: 'swap-horizontal-outline' as const,
              onPress: () => setShowMoveSheet(true),
              disabled: isDeleting || isMoving,
              variant: 'default' as const,
            }] : []),
            {
              icon: 'create-outline',
              onPress: handleEdit,
              disabled: isDeleting || isMoving,
              variant: 'primary',
            },
          ]}
        />
      )}

      {showEditModal && item && (
        <ItemForm
          initialData={{
            title: item.title,
            classification: item.classification,
            usagePurpose: item.usagePurpose,
            amount: item.amount,
            date: item.date,
            storeName: item.storeName,
            filePath: item.filePath,
            fileType: item.fileType,
            ocrText: item.ocrText,
            memo: item.memo,
          }}
          initialTags={item.tags}
          initialCustomValues={item.customValues?.reduce((acc, cv) => {
            acc[cv.fieldId] = cv.value;
            return acc;
          }, {} as Record<string, string | null>)}
          onSubmit={handleUpdateItem}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {item?.filePath && (
        <ImageZoomModal
          visible={showImageModal}
          imageUri={item.filePath}
          onClose={() => setShowImageModal(false)}
        />
      )}

      <SpaceMoveSheet
        visible={showMoveSheet}
        onClose={() => setShowMoveSheet(false)}
        onMove={handleMoveToSpace}
        currentSpaceId={currentSpace?.id ?? item?.spaceId}
        spaces={spaces}
        isMoving={isMoving}
      />
    </>
  );
}
