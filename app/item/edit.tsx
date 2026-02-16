/**
 * Item Edit Screen
 *
 * Screen for editing existing items using the ItemForm component.
 * Handles loading existing item data, image management (keep existing or change),
 * database updates, and store synchronization.
 *
 * Features:
 * - Load existing item data by ID
 * - Pre-populate form with existing values
 * - Optional image replacement
 * - Preserve existing image if not changed
 * - Database update via itemService
 * - Zustand store synchronization
 * - Error handling with retry logic
 * - Loading states
 *
 * Route params:
 * - id (required): Item ID to edit
 */

import { useState, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { ItemForm } from '@/components/item';
import { getItemById, updateItem } from '@/services/database/itemService';
import { getTagsForItem, setTagsForItem } from '@/services/database/tagService';
import { getItemCustomValues, setItemCustomValues } from '@/services/database/customFieldService';
import { useItemStore } from '@/store/itemStore';
import type { Item, CreateItemInput } from '@/types/item';

const ITEMS_IMAGES_DIR = FileSystem.documentDirectory + 'items/';

/**
 * Save item image to local file system
 *
 * @param sourceUri - Source URI of the image (camera or gallery)
 * @returns Promise<string> - Destination URI where image was saved
 * @throws Error if directory creation or file copy fails
 */
async function saveItemImage(sourceUri: string): Promise<string> {
  try {
    // Ensure items directory exists
    const dirInfo = await FileSystem.getInfoAsync(ITEMS_IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(ITEMS_IMAGES_DIR, { intermediates: true });
    }

    // Generate unique filename
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const destUri = ITEMS_IMAGES_DIR + fileName;

    // Copy image to app's document directory
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });

    return destUri;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`[FileSystem] Failed to save item image: ${errorMessage}`);
  }
}

/**
 * Delete old item image if it exists and is being replaced
 *
 * @param filePath - Path to the old image file
 */
async function deleteOldImage(filePath: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
      console.log('Deleted old image:', filePath);
    }
  } catch (error) {
    console.error('Failed to delete old image:', error);
    // Non-critical error, continue with update
  }
}

export default function ItemEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const updateItemInStore = useItemStore((state) => state.updateItem);

  // Load item data on mount
  useEffect(() => {
    loadItem();
  }, [id]);

  /**
   * Load item data from database
   */
  const loadItem = async () => {
    if (!id) {
      Alert.alert('오류', '잘못된 접근입니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
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

  /**
   * Handle form submission for edit
   *
   * This function:
   * 1. Checks if image was changed
   * 2. Saves new image if provided (and deletes old one)
   * 3. Updates item in database
   * 4. Updates Zustand store
   * 5. Navigates back to detail screen
   *
   * Error handling:
   * - FileSystem errors: Alert with retry option
   * - Database errors: Alert with retry option
   * - Image cleanup on database failure
   */
  const handleSubmit = async (data: CreateItemInput) => {
    if (!id || !item) {
      Alert.alert('오류', '항목 정보를 찾을 수 없습니다.');
      return;
    }

    let newImagePath: string | null = null;
    const oldImagePath = item.filePath;
    const imageChanged = data.filePath !== oldImagePath;

    try {
      // 1. Handle image update if changed
      if (imageChanged && data.filePath) {
        // Save new image
        newImagePath = await saveItemImage(data.filePath);

        // Delete old image if it exists
        if (oldImagePath) {
          await deleteOldImage(oldImagePath);
        }
      }

      // 2. Prepare update data
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

      // 3. Update in database
      await updateItem(id, updateData);

      // 4. Save tags if provided
      if (data.tags !== undefined) {
        await setTagsForItem(id, data.tags);
      }

      // 5. Save custom field values if provided
      if (data.customValues !== undefined) {
        await setItemCustomValues(id, data.customValues);
      }

      // 6. Update Zustand store with full updated item
      updateItemInStore(id, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      // 7. Navigate back with success message
      Alert.alert('성공', '항목이 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Item update error:', error);

      // If database update fails after new image save, clean up new image
      if (newImagePath && error instanceof Error && error.message.includes('[Database]')) {
        try {
          await FileSystem.deleteAsync(newImagePath, { idempotent: true });
          console.log('Cleaned up new image after database error:', newImagePath);

          // Restore old image if we deleted it
          // Note: This is a limitation - we can't restore the old image once deleted
          // In production, consider a two-phase commit or backup strategy
        } catch (cleanupError) {
          console.error('Failed to cleanup new image after error:', cleanupError);
        }
      }

      handleSaveError(error);
    }
  };

  /**
   * Handle save errors with user-friendly messages
   */
  const handleSaveError = (error: unknown) => {
    let errorTitle = '수정 실패';
    let errorMessage = '수정 중 오류가 발생했습니다.';
    let showRetry = true;

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // FileSystem errors
      if (errorMsg.includes('file') || errorMsg.includes('image') || errorMsg.includes('directory')) {
        errorTitle = '이미지 저장 실패';
        errorMessage = '이미지 저장에 실패했습니다.\n저장 공간을 확인해주세요.';
        console.error('[FileSystem Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      // Database errors
      else if (errorMsg.includes('database') || errorMsg.includes('sql') || errorMsg.includes('update')) {
        errorTitle = '데이터베이스 오류';
        errorMessage = '항목 수정에 실패했습니다.\n잠시 후 다시 시도해주세요.';
        console.error('[Database Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      // Permission errors
      else if (errorMsg.includes('permission') || errorMsg.includes('access denied')) {
        errorTitle = '권한 오류';
        errorMessage = '파일 접근 권한이 없습니다.\n앱 권한을 확인해주세요.';
        showRetry = false;
        console.error('[Permission Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      // Generic errors
      else {
        console.error('[Unknown Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      console.error('[Non-Error Exception]', {
        error: JSON.stringify(error),
        timestamp: new Date().toISOString(),
      });
    }

    // Show error alert
    const buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [];

    if (showRetry) {
      buttons.push({
        text: '재시도',
        // Note: User must re-submit form for retry
      });
    }

    buttons.push({
      text: '확인',
      style: 'cancel',
    });

    Alert.alert(errorTitle, errorMessage, buttons);
  };

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-500 dark:text-gray-400">항목 불러오는 중...</Text>
      </View>
    );
  }

  // Item not found state
  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text className="mt-4 text-gray-500 dark:text-gray-400">항목을 찾을 수 없습니다</Text>
      </View>
    );
  }

  // Convert custom values array to Record format for form
  const customValuesRecord: Record<string, string | null> = {};
  if (item.customValues) {
    item.customValues.forEach(cv => {
      customValuesRecord[cv.fieldId] = cv.value;
    });
  }

  // Convert Item to CreateItemInput format for ItemForm
  const initialData: Partial<CreateItemInput> & {
    tagObjects?: typeof item.tags;
  } = {
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
    tagObjects: item.tags, // Pass Tag objects for display
    customValues: customValuesRecord, // Pass custom values as Record for form
  };

  return (
    <ItemForm
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
