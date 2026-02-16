import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Development-only floating screenshot button
 * Captures the current screen and saves it to device gallery
 * File path is logged to console for adb logcat access
 */
export default function ScreenshotButton() {
  const screenRef = useRef(null);

  const takeScreenshot = async () => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '스크린샷을 저장하려면 갤러리 접근 권한이 필요합니다.');
        return;
      }

      // Capture the screen
      // Note: This captures the root view, not individual components
      const uri = await captureRef(screenRef, {
        format: 'png',
        quality: 1.0,
      });

      // Generate timestamp filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot_${timestamp}.png`;

      // On Android, save to Pictures/Screenshots/
      if (Platform.OS === 'android') {
        const downloadsDir = `${FileSystem.documentDirectory}../Pictures/Screenshots/`;

        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
        }

        const destPath = `${downloadsDir}${filename}`;
        await FileSystem.copyAsync({
          from: uri,
          to: destPath,
        });

        // Log path for adb logcat
        console.log('[SCREENSHOT]', destPath);
        console.log('[SCREENSHOT] Saved to:', destPath);

        Alert.alert('스크린샷 저장됨', `경로: ${destPath}`);
      } else {
        // On iOS, save to photo library
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('Screenshots', asset, false);

        console.log('[SCREENSHOT] Saved to photo library');
        Alert.alert('스크린샷 저장됨', '사진 라이브러리에 저장되었습니다.');
      }
    } catch (error) {
      console.error('[SCREENSHOT] Error:', error);
      Alert.alert('오류', '스크린샷 저장에 실패했습니다.');
    }
  };

  return (
    <View
      ref={screenRef}
      style={{ flex: 1 }}
      collapsable={false}
    >
      {/* Floating button in bottom right corner */}
      <TouchableOpacity
        onPress={takeScreenshot}
        style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#FF6B6B',
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          zIndex: 9999,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24 }}>📸</Text>
      </TouchableOpacity>
    </View>
  );
}
