import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/common';
import { extractReceiptData, OcrErrorType, ocrLogger } from '@/services/ocr';
import type { OcrError } from '@/services/ocr';
import { DEFAULT_CATEGORIES } from '@/constants';

export default function ReceiptFormScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [ocrError, setOcrError] = useState<OcrError | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
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
    setOcrError(null);

    try {
      const result = await extractReceiptData(imageUri);

      // OCR 결과 적용
      if (result.storeName) setStoreName(result.storeName);
      if (result.amount) setAmount(result.amount.toString());
      if (result.date) setDate(result.date);

      // 신뢰도 저장
      setConfidence(result.confidence || 0);

      // 경고 메시지가 있으면 표시
      if (result.warnings && result.warnings.length > 0) {
        Alert.alert(
          '일부 정보 추출 실패',
          `다음 정보를 찾을 수 없어 수동으로 입력해주세요:\n\n${result.warnings.join('\n')}`,
          [{ text: '확인' }]
        );
      }
    } catch (error) {
      console.error('OCR 실패:', error);

      // OcrError 타입 체크
      if (error && typeof error === 'object' && 'type' in error) {
        const ocrErr = error as OcrError;
        setOcrError(ocrErr);
        handleOcrErrorAlert(ocrErr);
      } else {
        Alert.alert(
          'OCR 오류',
          'OCR 처리 중 알 수 없는 오류가 발생했습니다. 수동으로 입력해주세요.',
          [{ text: '확인' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * OCR 에러를 사용자에게 친화적으로 표시
   */
  const handleOcrErrorAlert = (error: OcrError) => {
    const buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }> = [];

    // 재시도 가능한 경우 재시도 버튼 추가
    if (error.retryable) {
      buttons.push({
        text: '다시 시도',
        onPress: () => runOCR(),
      });
    }

    // 재촬영 권장 경우
    if (
      error.type === OcrErrorType.NO_TEXT_DETECTED ||
      error.type === OcrErrorType.POOR_IMAGE_QUALITY
    ) {
      buttons.push({
        text: '다시 촬영',
        onPress: () => router.back(),
      });
    }

    // 수동 입력 옵션 (항상 제공)
    buttons.push({
      text: '수동 입력',
      style: 'cancel',
    });

    Alert.alert(
      'OCR 처리 실패',
      `${error.userMessage}\n\n${error.suggestedAction || ''}`,
      buttons
    );

    // 에러 로그 출력 (개발자용)
    ocrLogger.error('OCR 에러 상세', undefined, {
      type: error.type,
      userMessage: error.userMessage,
      technicalMessage: error.technicalMessage,
      recoverable: error.recoverable,
      retryable: error.retryable,
    });
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1 p-4"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
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
              {/* OCR 신뢰도 및 에러 표시 */}
              {ocrError ? (
                <View className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="alert-circle" size={20} color="#DC2626" />
                    <Text className="ml-2 text-red-700 font-semibold">OCR 처리 실패</Text>
                  </View>
                  <Text className="text-red-600 text-sm">{ocrError.userMessage}</Text>
                  {ocrError.suggestedAction && (
                    <Text className="mt-2 text-red-600 text-sm">
                      {ocrError.suggestedAction}
                    </Text>
                  )}
                </View>
              ) : confidence > 0 && (
                <View className={`mb-4 p-4 rounded-lg border ${
                  confidence >= 0.7 ? 'bg-green-50 border-green-200' :
                  confidence >= 0.4 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-orange-50 border-orange-200'
                }`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons
                        name={confidence >= 0.7 ? 'checkmark-circle' : 'information-circle'}
                        size={20}
                        color={confidence >= 0.7 ? '#16A34A' : confidence >= 0.4 ? '#CA8A04' : '#EA580C'}
                      />
                      <Text className={`ml-2 font-semibold ${
                        confidence >= 0.7 ? 'text-green-700' :
                        confidence >= 0.4 ? 'text-yellow-700' :
                        'text-orange-700'
                      }`}>
                        {confidence >= 0.7 ? 'OCR 성공' :
                         confidence >= 0.4 ? '일부 정보 추출' :
                         '수동 입력 필요'}
                      </Text>
                    </View>
                    <Text className={`text-sm ${
                      confidence >= 0.7 ? 'text-green-600' :
                      confidence >= 0.4 ? 'text-yellow-600' :
                      'text-orange-600'
                    }`}>
                      {Math.round(confidence * 100)}%
                    </Text>
                  </View>
                  {confidence < 0.7 && (
                    <Text className={`mt-2 text-sm ${
                      confidence >= 0.4 ? 'text-yellow-700' : 'text-orange-700'
                    }`}>
                      누락된 정보를 직접 입력해주세요
                    </Text>
                  )}
                </View>
              )}

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
