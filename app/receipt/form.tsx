import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/common';
import { extractReceiptData } from '@/services/ocr';
import { DEFAULT_CATEGORIES } from '@/constants';

export default function ReceiptFormScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    runOCR();
  }, []);

  const runOCR = async () => {
    if (!imageUri) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await extractReceiptData(imageUri);
      if (result.storeName) setStoreName(result.storeName);
      if (result.amount) setAmount(result.amount.toString());
      if (result.date) setDate(result.date);
    } catch (error) {
      console.error('OCR 실패:', error);
      Alert.alert('알림', 'OCR 처리 중 오류가 발생했습니다. 수동으로 입력해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    // 유효성 검증
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert('오류', '금액을 입력해주세요');
      return;
    }
    if (!date) {
      Alert.alert('오류', '날짜를 입력해주세요');
      return;
    }

    // TODO: 다음 단계에서 실제 저장 로직 구현
    // - 이미지 파일 시스템에 저장
    // - 영수증 데이터베이스에 저장
    // - 영수증 목록 화면으로 이동
    Alert.alert(
      '준비 중',
      '저장 기능은 다음 단계에서 구현됩니다.\n\n입력된 정보:\n' +
      `상호명: ${storeName || '(없음)'}\n` +
      `금액: ${amount}원\n` +
      `날짜: ${date}\n` +
      `카테고리: ${category ? DEFAULT_CATEGORIES.find(c => c.id === category)?.name : '(없음)'}\n` +
      `메모: ${memo || '(없음)'}`,
      [{ text: '확인', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 헤더 */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="뒤로 가기">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
          영수증 정보
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        {/* 이미지 썸네일 */}
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            className="w-full h-40 rounded-lg mb-4"
            resizeMode="cover"
            accessibilityLabel="영수증 이미지"
          />
        )}

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-2 text-gray-500">OCR 분석 중...</Text>
          </View>
        ) : (
          <>
            {/* 상호명 */}
            <Input
              label="상호명"
              value={storeName}
              onChangeText={setStoreName}
              placeholder="상호명 입력"
              autoCapitalize="words"
            />

            {/* 금액 */}
            <Input
              label="금액 (필수)"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
            />

            {/* 날짜 */}
            <Input
              label="날짜 (필수)"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />

            {/* 카테고리 선택 */}
            <View className="mb-4">
              <Text className="text-gray-700 text-base font-medium mb-2">
                카테고리
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    className={`px-4 py-2 rounded-full ${
                      category === cat.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    accessibilityLabel={`카테고리 ${cat.name}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === cat.id }}
                  >
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={category === cat.id ? '#FFFFFF' : '#374151'}
                      />
                      <Text
                        className={`${
                          category === cat.id ? 'text-white' : 'text-gray-700'
                        } font-medium`}
                      >
                        {cat.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 메모 */}
            <Input
              label="메모 (선택)"
              value={memo}
              onChangeText={setMemo}
              placeholder="메모를 입력하세요"
              multiline
              numberOfLines={3}
            />
          </>
        )}
      </ScrollView>

      {/* 저장 버튼 */}
      <View className="p-4 border-t border-gray-200">
        <Button
          title="저장"
          onPress={handleSave}
          variant="primary"
          disabled={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}
