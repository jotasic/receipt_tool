/**
 * Item Add Screen
 *
 * Screen for adding new items using the ItemForm component.
 * Handles image saving to file system, database creation, and store updates.
 *
 * Features:
 * - ItemForm integration with all item types
 * - OCR text extraction from captured images
 * - Image file system management (items/ directory)
 * - Database persistence via itemService
 * - Zustand store synchronization
 * - Error handling with retry logic
 * - Loading states during save operation
 *
 * Route params:
 * - imageUri (optional): Pre-captured image URI for OCR processing
 */

import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { ItemForm } from '@/components/item';
import { createItem } from '@/services/database/itemService';
import { setTagsForItem } from '@/services/database/tagService';
import { useItemStore } from '@/store/itemStore';
import type { CreateItemInput } from '@/types/item';

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

export default function ItemAddScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const addItem = useItemStore((state) => state.addItem);

  /**
   * Handle form submission
   *
   * This function:
   * 1. Saves the image to file system (if provided)
   * 2. Creates item record in database
   * 3. Updates Zustand store with new item
   * 4. Navigates back on success
   *
   * Error handling:
   * - FileSystem errors: Alert with retry option
   * - Database errors: Alert with retry option
   * - Image cleanup on database failure
   */
  const handleSubmit = async (data: CreateItemInput) => {
    let savedImagePath: string | null = null;

    try {
      // 1. Save image to file system (if provided)
      if (data.filePath) {
        savedImagePath = await saveItemImage(data.filePath);
      }

      // 2. Create item in database (exclude tags from item creation)
      const { tags: tagIds, ...itemData } = data;
      const item = await createItem({
        ...itemData,
        filePath: savedImagePath || undefined,
      });

      // 3. Save tags if provided
      if (tagIds && tagIds.length > 0) {
        await setTagsForItem(item.id, tagIds);
      }

      // 4. Update Zustand store
      addItem(item);

      // 5. Navigate back with success message
      Alert.alert('성공', '항목이 저장되었습니다.', [
        { text: '확인', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error) {
      console.error('Item save error:', error);

      // If database save fails after image save, clean up image
      if (savedImagePath && error instanceof Error && error.message.includes('[Database]')) {
        try {
          await FileSystem.deleteAsync(savedImagePath, { idempotent: true });
          console.log('Cleaned up image after database error:', savedImagePath);
        } catch (cleanupError) {
          console.error('Failed to cleanup image after error:', cleanupError);
        }
      }

      handleSaveError(error);
    }
  };

  /**
   * Handle save errors with user-friendly messages
   *
   * Categorizes errors and provides appropriate retry options:
   * - FileSystem errors: Check storage space
   * - Database errors: Retry available
   * - Network errors: Check connection (future cloud sync)
   * - Permission errors: No retry (need settings change)
   */
  const handleSaveError = (error: unknown) => {
    let errorTitle = '저장 실패';
    let errorMessage = '저장 중 오류가 발생했습니다.';
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
      else if (errorMsg.includes('database') || errorMsg.includes('sql') || errorMsg.includes('insert')) {
        errorTitle = '데이터베이스 오류';
        errorMessage = '항목 저장에 실패했습니다.\n잠시 후 다시 시도해주세요.';
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

    // Show error alert with retry option
    const buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [];

    // Retry button (if applicable)
    if (showRetry) {
      buttons.push({
        text: '재시도',
        // Note: Can't directly retry from here, user must re-submit form
      });
    }

    // Cancel button
    buttons.push({
      text: '확인',
      style: 'cancel',
    });

    Alert.alert(errorTitle, errorMessage, buttons);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
          항목 추가
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form */}
      <ItemForm
        imageUri={imageUri}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}
