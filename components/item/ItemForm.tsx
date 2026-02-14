/**
 * ItemForm - Unified form component for adding/editing items
 *
 * Combines receipt and document functionality with dynamic fields
 * that show/hide based on classification type.
 *
 * Features:
 * - Classification selector (personal_card, corporate_card, proof_document)
 * - Usage purpose selector (meal, transportation, medical, other)
 * - Image picker (camera or gallery)
 * - Dynamic fields based on classification
 * - Form validation
 * - Loading states
 *
 * @example
 * ```tsx
 * <ItemForm
 *   onSubmit={async (data) => {
 *     await createItem(data);
 *     router.back();
 *   }}
 *   onCancel={() => router.back()}
 * />
 * ```
 *
 * @example With initial data (edit mode)
 * ```tsx
 * <ItemForm
 *   initialData={{
 *     title: '스타벅스 커피',
 *     classification: 'personal_card',
 *     usagePurpose: 'meal',
 *     amount: 4500,
 *     storeName: '스타벅스 강남점'
 *   }}
 *   onSubmit={async (data) => {
 *     await updateItem(itemId, data);
 *     router.back();
 *   }}
 * />
 * ```
 */

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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/common';
import { ClassificationSelector } from './ClassificationSelector';
import { UsagePurposeSelector } from './UsagePurposeSelector';
import type { CreateItemInput } from '@/types/item';
import type { ItemClassification, UsagePurpose } from '@/types/shared';

interface ItemFormProps {
  /** Initial form data for edit mode (optional) */
  initialData?: Partial<CreateItemInput>;
  /** Callback when form is submitted successfully */
  onSubmit: (data: CreateItemInput) => Promise<void>;
  /** Callback when cancel button is pressed (optional) */
  onCancel?: () => void;
}

export function ItemForm({
  initialData,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  // Form state
  const [classification, setClassification] = useState<ItemClassification>(
    initialData?.classification || 'corporate_card'
  );
  const [usagePurpose, setUsagePurpose] = useState<UsagePurpose>(
    initialData?.usagePurpose || 'meal'
  );
  const [imageUri, setImageUri] = useState<string | null>(
    initialData?.filePath || null
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(
    initialData?.amount ? String(initialData.amount) : ''
  );
  const [storeName, setStoreName] = useState(initialData?.storeName || '');
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split('T')[0]
  );
  const [memo, setMemo] = useState(initialData?.memo || '');

  // UI state
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic field visibility based on classification
  const showAmount = classification !== 'proof_document';
  const showStoreName =
    classification === 'personal_card' || classification === 'corporate_card';

  // Camera capture
  const takePhoto = async () => {
    try {
      setIsLoadingImage(true);
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
      setIsLoadingImage(false);
    }
  };

  // Gallery picker
  const pickImage = async () => {
    try {
      setIsLoadingImage(true);
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

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
      setIsLoadingImage(false);
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

  // Form validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }

    if (showAmount && (!amount || parseInt(amount) <= 0)) {
      newErrors.amount = '금액을 입력해주세요';
    }

    if (!date) {
      newErrors.date = '날짜를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      const itemData: CreateItemInput = {
        title: title.trim(),
        classification,
        usagePurpose,
        date,
        filePath: imageUri || undefined,
        fileType: imageUri ? 'image/jpeg' : undefined,
        memo: memo.trim() || undefined,
      };

      // Add amount for expense items
      if (showAmount && amount) {
        itemData.amount = parseInt(amount);
      }

      // Add storeName for receipt items
      if (showStoreName && storeName.trim()) {
        itemData.storeName = storeName.trim();
      }

      await onSubmit(itemData);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert(
        '저장 실패',
        '저장 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '재시도', onPress: handleSubmit },
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
        {/* Classification Selector */}
        <View className="mb-6">
          <Text className="text-gray-700 text-base font-medium mb-3">
            분류 (필수)
          </Text>
          <ClassificationSelector
            selectedClassification={classification}
            onSelect={setClassification}
          />
        </View>

        {/* Usage Purpose Selector */}
        <View className="mb-6">
          <Text className="text-gray-700 text-base font-medium mb-3">
            용도 (필수)
          </Text>
          <UsagePurposeSelector
            selectedPurpose={usagePurpose}
            onSelect={setUsagePurpose}
          />
        </View>

        {/* Image/File Picker */}
        <View className="mb-6">
          <Text className="text-gray-700 text-base font-medium mb-3">
            사진 (선택)
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
                disabled={isLoadingImage}
                className="flex-1 py-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg items-center justify-center"
                activeOpacity={0.7}
              >
                {isLoadingImage ? (
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
                disabled={isLoadingImage}
                className="flex-1 py-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg items-center justify-center"
                activeOpacity={0.7}
              >
                {isLoadingImage ? (
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

        {/* Title Input */}
        <Input
          label="제목 (필수)"
          value={title}
          onChangeText={setTitle}
          placeholder="제목"
          autoCapitalize="sentences"
          error={errors.title}
        />

        {/* Amount Input - Conditional */}
        {showAmount && (
          <Input
            label="금액 (필수)"
            value={amount}
            onChangeText={setAmount}
            placeholder="금액"
            keyboardType="numeric"
            error={errors.amount}
          />
        )}

        {/* Store Name Input - Conditional */}
        {showStoreName && (
          <Input
            label="사용처"
            value={storeName}
            onChangeText={setStoreName}
            placeholder="사용처"
            autoCapitalize="words"
          />
        )}

        {/* Date Input */}
        <Input
          label="날짜 (필수)"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          error={errors.date}
        />

        {/* Memo Input */}
        <Input
          label="메모 (선택)"
          value={memo}
          onChangeText={setMemo}
          placeholder="메모"
          multiline
          numberOfLines={4}
        />
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 border-t border-gray-200 gap-2">
        <Button
          title={isSaving ? '저장 중...' : '저장'}
          onPress={handleSubmit}
          variant="primary"
          disabled={isSaving}
          loading={isSaving}
        />
        {onCancel && (
          <Button
            title="취소"
            onPress={onCancel}
            variant="outline"
            disabled={isSaving}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
