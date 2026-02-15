import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/common';
import { DocumentTypeSelector } from '@/components/document';
import { createDocument } from '@/services/database/documentService';
import type { DocumentType } from '@/types';

export default function DocumentAddScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Camera capture
  const takePhoto = async () => {
    try {
      setIsLoading(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          '권한 필요',
          '카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
          [{ text: '확인' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('오류', '카메라를 실행할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Gallery picker
  const pickImage = async () => {
    try {
      setIsLoading(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          '권한 필요',
          '갤러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
          [{ text: '확인' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('오류', '이미지를 선택할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    Alert.alert('이미지 삭제', '선택한 이미지를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => setImageUri(null),
      },
    ]);
  };

  // Save document
  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요');
      return;
    }

    setIsSaving(true);
    try {
      await createDocument({
        title: title.trim(),
        documentType,
        filePath: imageUri || undefined,
        fileType: imageUri ? 'image' : undefined,
        memo: memo.trim() || undefined,
      });

      Alert.alert('성공', '서류가 저장되었습니다.', [
        { text: '확인', onPress: () => router.replace('/(tabs)/documents') },
      ]);
    } catch (error) {
      console.error('Document save error:', error);
      Alert.alert(
        '저장 실패',
        '서류 저장 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '재시도', onPress: handleSave },
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="뒤로 가기"
          disabled={isSaving}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isSaving ? '#9CA3AF' : '#111827'}
          />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
          서류 추가
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Image Section */}
          <View className="mb-6">
            <Text className="text-gray-700 text-base font-medium mb-3">
              서류 사진 (선택)
            </Text>

            {imageUri ? (
              <View className="relative">
                <Image
                  source={{ uri: imageUri }}
                  className="w-full h-48 rounded-lg bg-gray-100"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={removeImage}
                  className="absolute top-2 right-2 bg-red-600 rounded-full w-8 h-8 items-center justify-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                  accessibilityLabel="이미지 삭제"
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={takePhoto}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg items-center justify-center"
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={32} color="#2563EB" />
                      <Text className="text-blue-600 font-medium mt-2">
                        카메라
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg items-center justify-center"
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <>
                      <Ionicons name="images" size={32} color="#2563EB" />
                      <Text className="text-blue-600 font-medium mt-2">
                        갤러리
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Document Type Selector */}
          <DocumentTypeSelector
            selectedType={documentType}
            onSelect={setDocumentType}
          />

          {/* Title Input */}
          <Input
            label="제목 (필수)"
            value={title}
            onChangeText={setTitle}
            placeholder="서류 제목을 입력하세요"
            autoCapitalize="sentences"
          />

          {/* Memo Input */}
          <Input
            label="메모 (선택)"
            value={memo}
            onChangeText={setMemo}
            placeholder="메모를 입력하세요"
            multiline
            numberOfLines={4}
          />
        </ScrollView>

        {/* Save Button */}
        <View className="p-4 border-t border-gray-200">
          <Button
            title={isSaving ? '저장 중...' : '저장'}
            onPress={handleSave}
            variant="primary"
            disabled={!title.trim() || isSaving}
            loading={isSaving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
