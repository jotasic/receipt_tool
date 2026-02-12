import { useState } from 'react';
import { View, Text, Image, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common';

export default function AddReceiptScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        allowsEditing: true,
        aspect: [3, 4],
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
        allowsEditing: true,
        aspect: [3, 4],
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
        // 이미지 미리보기 화면
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
