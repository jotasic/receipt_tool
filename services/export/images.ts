/**
 * Image Collection Utilities
 *
 * Collects and processes images from items for export
 */

import * as FileSystem from 'expo-file-system/legacy';
import type { Item } from '@/types/item';
import { generateImageFilename } from './csv';

export interface ImageData {
  filename: string;
  base64: string;
}

/**
 * Read image file as base64
 */
async function readImageAsBase64(filePath: string): Promise<string | null> {
  try {
    // Construct full file path
    const fullPath = filePath.startsWith('file://')
      ? filePath
      : `${FileSystem.documentDirectory}${filePath}`;

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(fullPath);
    if (!fileInfo.exists) {
      console.warn(`[Export] Image file not found: ${fullPath}`);
      return null;
    }

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(fullPath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return base64;
  } catch (error) {
    console.error(`[Export] Failed to read image: ${filePath}`, error);
    return null;
  }
}

/**
 * Collect all images from items
 * Returns array of { filename, base64 } objects
 */
export async function collectImages(items: Item[]): Promise<ImageData[]> {
  const imageDataList: ImageData[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.filePath) {
      continue;
    }

    const filename = generateImageFilename(item, i);
    const base64 = await readImageAsBase64(item.filePath);

    if (base64) {
      imageDataList.push({ filename, base64 });
    }
  }

  return imageDataList;
}

/**
 * Get total size of all images (in MB)
 */
export function estimateExportSize(items: Item[]): number {
  // Rough estimate: average image size ~500KB
  const imageCount = items.filter(item => item.filePath).length;
  return (imageCount * 0.5); // MB
}
