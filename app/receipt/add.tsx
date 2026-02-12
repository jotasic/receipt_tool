import { useState } from 'react';
import { View, Text, Image, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common';

export default function AddReceiptScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 카메라 촬영
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
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setPreviewUri(uri);
        setOriginalUri(uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('오류', '카메라를 실행할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 갤러리 선택
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
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setPreviewUri(uri);
        setOriginalUri(uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('오류', '이미지를 선택할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 편집 모드 시작
  const startEditMode = () => {
    setEditMode(true);
  };

  // 편집 완료
  const finishEdit = () => {
    setEditMode(false);
  };

  // 편집 취소 (원본으로 복원)
  const cancelEdit = () => {
    if (originalUri) {
      setPreviewUri(originalUri);
    }
    setEditMode(false);
  };

  // 90도 회전
  const rotateImage = async () => {
    if (!previewUri) return;

    try {
      setIsEditing(true);
      const result = await ImageManipulator.manipulateAsync(
        previewUri,
        [{ rotate: 90 }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPreviewUri(result.uri);
    } catch (error) {
      console.error('Rotate error:', error);
      Alert.alert('오류', '이미지를 회전할 수 없습니다.');
    } finally {
      setIsEditing(false);
    }
  };

  // 좌우 반전
  const flipHorizontal = async () => {
    if (!previewUri) return;

    try {
      setIsEditing(true);
      const result = await ImageManipulator.manipulateAsync(
        previewUri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPreviewUri(result.uri);
    } catch (error) {
      console.error('Flip horizontal error:', error);
      Alert.alert('오류', '이미지를 반전할 수 없습니다.');
    } finally {
      setIsEditing(false);
    }
  };

  // 상하 반전
  const flipVertical = async () => {
    if (!previewUri) return;

    try {
      setIsEditing(true);
      const result = await ImageManipulator.manipulateAsync(
        previewUri,
        [{ flip: ImageManipulator.FlipType.Vertical }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPreviewUri(result.uri);
    } catch (error) {
      console.error('Flip vertical error:', error);
      Alert.alert('오류', '이미지를 반전할 수 없습니다.');
    } finally {
      setIsEditing(false);
    }
  };

  // 자르기 (향후 구현 예정)
  const cropImage = async () => {
    Alert.alert(
      '자르기 기능',
      '자르기 기능은 촬영/선택 시 기본 편집 도구를 사용해주세요.\n\n회전 및 반전 기능으로 이미지를 조정할 수 있습니다.',
      [{ text: '확인' }]
    );
  };

  // 이미지 사용 확정
  const handleUseImage = () => {
    if (previewUri) {
      setImageUri(previewUri);
    }
  };

  // 다음 단계로 (입력 폼)
  const handleNext = () => {
    if (imageUri) {
      router.push({
        pathname: '/receipt/form',
        params: { imageUri },
      });
    }
  };

  // 이미지 재선택
  const handleRetake = () => {
    setImageUri(null);
    setPreviewUri(null);
    setOriginalUri(null);
    setEditMode(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
          영수증 추가
        </Text>
        <View className="w-10" />
      </View>

      {/* Content */}
      {imageUri ? (
        // 최종 확정된 이미지 - 폼으로 이동
        <View className="flex-1 p-4">
          <View className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              source={{ uri: imageUri }}
              className="flex-1"
              resizeMode="contain"
            />
          </View>

          <View className="flex-row mt-4 gap-3">
            <View className="flex-1">
              <Button
                title="재선택"
                variant="outline"
                onPress={handleRetake}
                disabled={isLoading}
              />
            </View>
            <View className="flex-1">
              <Button
                title="다음"
                variant="primary"
                onPress={handleNext}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      ) : previewUri ? (
        // 이미지 미리보기 및 편집 화면
        <View className="flex-1 p-4">
          <View className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative">
            <Image
              source={{ uri: previewUri }}
              className="flex-1"
              resizeMode="contain"
            />
            {isEditing && (
              <View className="absolute inset-0 bg-black/50 items-center justify-center">
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>

          <View className="mt-4">
            {editMode ? (
              // 편집 모드 UI
              <>
                <Text className="text-sm text-gray-600 text-center mb-4">
                  이미지를 편집하세요
                </Text>

                {/* 편집 버튼 그리드 */}
                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    onPress={rotateImage}
                    disabled={isEditing}
                    className="flex-1 items-center justify-center py-4 bg-white border-2 border-blue-500 rounded-lg"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="reload-outline" size={24} color="#3B82F6" />
                    <Text className="text-sm font-medium text-blue-500 mt-1">
                      회전
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={cropImage}
                    disabled={true}
                    className="flex-1 items-center justify-center py-4 bg-gray-100 border-2 border-gray-300 rounded-lg opacity-50"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="crop-outline" size={24} color="#9CA3AF" />
                    <Text className="text-sm font-medium text-gray-400 mt-1">
                      자르기
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      (준비중)
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    onPress={flipHorizontal}
                    disabled={isEditing}
                    className="flex-1 items-center justify-center py-4 bg-white border-2 border-blue-500 rounded-lg"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="swap-horizontal-outline" size={24} color="#3B82F6" />
                    <Text className="text-sm font-medium text-blue-500 mt-1">
                      좌우 반전
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={flipVertical}
                    disabled={isEditing}
                    className="flex-1 items-center justify-center py-4 bg-white border-2 border-blue-500 rounded-lg"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="swap-vertical-outline" size={24} color="#3B82F6" />
                    <Text className="text-sm font-medium text-blue-500 mt-1">
                      상하 반전
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 편집 완료/취소 버튼 */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      title="취소"
                      variant="outline"
                      onPress={cancelEdit}
                      disabled={isEditing}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title="완료"
                      variant="primary"
                      onPress={finishEdit}
                      disabled={isEditing}
                    />
                  </View>
                </View>
              </>
            ) : (
              // 일반 모드 UI
              <>
                <Text className="text-sm text-gray-600 text-center mb-4">
                  이미지를 확인하고 필요시 편집하세요
                </Text>

                <View className="gap-3">
                  <Button
                    title="편집하기"
                    variant="outline"
                    onPress={startEditMode}
                    disabled={isLoading}
                    icon={<Ionicons name="create-outline" size={20} color="#2563eb" />}
                  />

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Button
                        title="다시 선택"
                        variant="outline"
                        onPress={handleRetake}
                        disabled={isLoading}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        title="사용하기"
                        variant="primary"
                        onPress={handleUseImage}
                        disabled={isLoading}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      ) : (
        // 이미지 선택 화면
        <View className="flex-1 items-center justify-center p-6">
          <View className="items-center mb-12">
            <View className="bg-blue-50 rounded-full p-6 mb-6">
              <Ionicons name="camera-outline" size={80} color="#2563eb" />
            </View>

            <Text className="text-2xl font-bold text-gray-900 mb-2">
              영수증 사진을 추가하세요
            </Text>

            <Text className="text-base text-gray-500 text-center leading-6">
              카메라로 촬영하거나{'\n'}갤러리에서 선택할 수 있습니다
            </Text>
          </View>

          <View className="w-full max-w-sm gap-3">
            <Button
              title="카메라로 촬영"
              onPress={takePhoto}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
            />

            <Button
              title="갤러리에서 선택"
              onPress={pickImage}
              variant="outline"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          {/* Tips */}
          <View className="mt-12 px-4">
            <View className="flex-row items-start mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text className="flex-1 text-sm text-gray-600 ml-3">
                영수증 전체가 잘 보이도록 촬영해주세요
              </Text>
            </View>

            <View className="flex-row items-start mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text className="flex-1 text-sm text-gray-600 ml-3">
                밝은 곳에서 촬영하면 더 정확합니다
              </Text>
            </View>

            <View className="flex-row items-start">
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text className="flex-1 text-sm text-gray-600 ml-3">
                글씨가 선명하게 보이는지 확인해주세요
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
