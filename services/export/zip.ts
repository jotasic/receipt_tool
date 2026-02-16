/**
 * ZIP Creation Utilities
 *
 * Creates ZIP file containing CSV and images using jszip
 */

import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';
import type { ImageData } from './images';

/**
 * Create ZIP file with CSV and images
 *
 * @param csvContent - CSV file content
 * @param images - Array of image data
 * @param filename - Output ZIP filename
 * @returns Promise<string> - Path to the created ZIP file
 */
export async function createZipFile(
  csvContent: string,
  images: ImageData[],
  filename: string
): Promise<string> {
  try {
    const zip = new JSZip();

    // Add CSV file
    zip.file('정산내역.csv', csvContent);

    // Add images folder
    const imagesFolder = zip.folder('images');
    if (imagesFolder) {
      for (const image of images) {
        // Add image as base64
        imagesFolder.file(image.filename, image.base64, { base64: true });
      }
    }

    // Generate ZIP as base64
    const zipBase64 = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6, // Balanced compression
      },
    });

    // Save to file system
    const zipPath = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(zipPath, zipBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`[Export] ZIP created successfully: ${zipPath}`);
    return zipPath;
  } catch (error) {
    console.error('[Export] Failed to create ZIP file:', error);
    throw new Error('ZIP 파일 생성에 실패했습니다');
  }
}

/**
 * Generate ZIP filename for a given year and month
 */
export function getZipFilename(year: number, month: number): string {
  const monthStr = String(month).padStart(2, '0');
  return `정산_${year}년${monthStr}월.zip`;
}

/**
 * Delete temporary ZIP file
 */
export async function cleanupZipFile(filePath: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
      console.log(`[Export] Cleaned up ZIP file: ${filePath}`);
    }
  } catch (error) {
    console.error('[Export] Failed to cleanup ZIP file:', error);
  }
}
