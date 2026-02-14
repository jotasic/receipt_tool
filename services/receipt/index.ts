/**
 * Receipt Business Logic Service
 *
 * Handles receipt saving, image management, and coordination between
 * database and store
 */

import * as FileSystem from 'expo-file-system/legacy';
import { createReceipt, deleteReceipt, getReceipts } from '@/services/database/receiptService';
import { useReceiptStore } from '@/store/receiptStore';
import type { Receipt, ReceiptType } from '@/types';

const RECEIPT_IMAGES_DIR = FileSystem.documentDirectory + 'receipts/';

/**
 * Save receipt image to local file system
 *
 * @param sourceUri - Source URI of the image (camera or gallery)
 * @returns Promise<string> - Destination URI where image was saved
 * @throws Error if directory creation or file copy fails
 */
async function saveReceiptImage(sourceUri: string): Promise<string> {
  try {
    // Ensure receipts directory exists
    const dirInfo = await FileSystem.getInfoAsync(RECEIPT_IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECEIPT_IMAGES_DIR, { intermediates: true });
    }

    // Generate unique filename
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const destUri = RECEIPT_IMAGES_DIR + fileName;

    // Copy image to app's document directory
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });

    return destUri;
  } catch (error) {
    // Throw with specific error type for better error handling in UI
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `[FileSystem] Failed to save receipt image: ${errorMessage}`
    );
  }
}

/**
 * Save a new receipt with image
 *
 * This function:
 * 1. Saves the image to local file system
 * 2. Creates receipt record in database
 * 3. Updates Zustand store with new receipt
 *
 * @param data - Receipt data with image URI
 * @returns Promise<Receipt> - The created receipt
 * @throws Error if image saving or database operation fails
 */
export async function saveReceipt(data: {
  imageUri: string;
  storeName: string;
  amount: number;
  date: string;
  category: string;
  memo?: string;
  receiptType?: ReceiptType;
}): Promise<Receipt> {
  let savedImagePath: string | null = null;

  try {
    // 1. Save image to file system
    savedImagePath = await saveReceiptImage(data.imageUri);

    // 2. Save receipt to database
    const receipt = await createReceipt({
      title: data.storeName || '영수증',
      storeName: data.storeName,
      amount: data.amount,
      date: data.date,
      category: data.category,
      imagePath: savedImagePath,
      ocrText: data.memo,
      receiptType: data.receiptType || 'corporate',
      memo: data.memo,
    });

    // 3. Update Zustand store
    useReceiptStore.getState().addReceipt(receipt);

    return receipt;
  } catch (error) {
    // If database save fails after image save, try to clean up image
    if (savedImagePath && error instanceof Error && error.message.includes('database')) {
      try {
        await FileSystem.deleteAsync(savedImagePath, { idempotent: true });
        console.log('Cleaned up image after database error:', savedImagePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup image after error:', cleanupError);
      }
    }

    // Re-throw the original error with proper categorization
    if (error instanceof Error) {
      // If error already has a category tag, re-throw as is
      if (error.message.includes('[FileSystem]') || error.message.includes('[Database]')) {
        throw error;
      }
      // Otherwise, tag it as database error
      throw new Error(`[Database] Failed to save receipt: ${error.message}`);
    }

    throw new Error('[Unknown] Failed to save receipt: Unknown error');
  }
}

/**
 * Delete receipt including its image file
 *
 * This function:
 * 1. Deletes the image file from file system (if exists)
 * 2. Deletes receipt record from database
 * 3. Updates Zustand store to remove receipt
 *
 * @param receiptId - Receipt ID to delete
 * @param imagePath - Optional path to image file
 * @returns Promise<void>
 * @throws Error if deletion fails
 */
export async function deleteReceiptWithImage(
  receiptId: string,
  imagePath?: string
): Promise<void> {
  try {
    // 1. Delete image file if it exists
    if (imagePath) {
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(imagePath);
      }
    }

    // 2. Delete from database
    await deleteReceipt(receiptId);

    // 3. Update store
    useReceiptStore.getState().deleteReceipt(receiptId);
  } catch (error) {
    throw new Error(
      `Failed to delete receipt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Load all receipts from database into store
 *
 * This is typically called on app initialization to sync
 * the store with the database
 *
 * @returns Promise<void>
 * @throws Error if database operation fails
 */
export async function loadReceipts(): Promise<void> {
  const store = useReceiptStore.getState();

  store.setLoading(true);
  store.setError(null);

  try {
    const receipts = await getReceipts();
    store.setReceipts(receipts);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    store.setError(`Failed to load receipts: ${errorMessage}`);
    throw error;
  } finally {
    store.setLoading(false);
  }
}

/**
 * Get receipts directory path
 *
 * @returns string - Path to receipts directory
 */
export function getReceiptsDirectory(): string {
  return RECEIPT_IMAGES_DIR;
}

/**
 * Check if receipts directory exists
 *
 * @returns Promise<boolean>
 */
export async function receiptsDirectoryExists(): Promise<boolean> {
  const dirInfo = await FileSystem.getInfoAsync(RECEIPT_IMAGES_DIR);
  return dirInfo.exists;
}
