import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/common';
import { OcrOverlay, type SelectedItem } from '@/components/receipt';
import { extractReceiptData, extractTextDetailed, OcrErrorType, ocrLogger, getCurrentProvider } from '@/services/ocr';
import type { OcrError, OcrBlock } from '@/services/ocr';
import { DEFAULT_CATEGORIES } from '@/constants';
import { saveReceipt } from '@/services/receipt';

export default function ReceiptFormScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ocrError, setOcrError] = useState<OcrError | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isMockMode, setIsMockMode] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showOcrOverlay, setShowOcrOverlay] = useState(false);
  const [ocrBlocks, setOcrBlocks] = useState<OcrBlock[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
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
      // 상세 OCR 결과 (바운딩 박스 포함)
      const detailedResult = await extractTextDetailed(imageUri);
      setOcrBlocks(detailedResult.blocks);

      // 이미지 크기 가져오기
      Image.getSize(imageUri, (width, height) => {
        setImageSize({ width, height });
      }, (error) => {
        console.error('이미지 크기 가져오기 실패:', error);
      });

      const result = await extractReceiptData(imageUri);

      // 현재 프로바이더 확인 (Mock 모드 여부)
      const provider = getCurrentProvider();
      setIsMockMode(provider === 'mock');

      // OCR 결과 적용
      if (result.storeName) setStoreName(result.storeName);
      if (result.amount) setAmount(result.amount.toString());
      if (result.date) setDate(result.date);

      // 신뢰도 저장
      setConfidence(result.confidence || 0);

      // 경고 메시지가 있으면 표시 (Mock 모드 제외)
      if (result.warnings && result.warnings.length > 0 && provider !== 'mock') {
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

  // OCR 오버레이에서 항목 선택
  const handleSelectItem = (item: SelectedItem) => {
    // 같은 모드의 기존 선택 제거
    const filtered = selectedItems.filter(i => i.mode !== item.mode);
    setSelectedItems([...filtered, item]);

    // 선택된 값 적용
    if (item.mode === 'storeName') {
      setStoreName(item.text);
    } else if (item.mode === 'amount') {
      // 숫자만 추출
      const numericValue = item.text.replace(/[^0-9]/g, '');
      setAmount(numericValue);
    } else if (item.mode === 'date') {
      // 날짜 형식 정규화 시도
      const dateMatch = item.text.match(/(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
      if (dateMatch) {
        let year = dateMatch[1];
        if (year.length === 2) {
          year = '20' + year;
        }
        setDate(`${year}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`);
      } else {
        setDate(item.text);
      }
    }
  };

  // OCR 오버레이에서 항목 선택 해제
  const handleDeselectItem = (lineIndex: string) => {
    const item = selectedItems.find(i => i.lineIndex === lineIndex);
    setSelectedItems(selectedItems.filter(i => i.lineIndex !== lineIndex));

    // 해제된 값 초기화
    if (item) {
      if (item.mode === 'storeName') setStoreName('');
      else if (item.mode === 'amount') setAmount('');
      else if (item.mode === 'date') setDate('');
    }
  };

  /**
   * 영수증 저장 처리
   *
   * 유효성 검증 후 저장하고, 실패 시 상세한 에러 메시지와 재시도 옵션 제공
   */
  const handleSave = async () => {
    // 유효성 검증
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert('오류', '금액을 입력해주세요');
      return;
    }
    if (!date) {
      Alert.alert('오류', '날짜를 입력해주세요');
      return;
    }
    if (!imageUri) {
      Alert.alert('오류', '영수증 이미지가 없습니다');
      return;
    }

    setIsSaving(true);
    try {
      await saveReceipt({
        imageUri,
        storeName,
        amount: parseInt(amount),
        date,
        category,
        memo,
        receiptType: 'corporate'
      });

      Alert.alert('성공', '영수증이 저장되었습니다.', [
        { text: '확인', onPress: () => router.replace('/(tabs)/receipts') }
      ]);
    } catch (error) {
      console.error('영수증 저장 실패:', error);
      handleSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 저장 에러를 사용자 친화적으로 처리
   *
   * 에러 유형에 따라 적절한 메시지를 표시하고 재시도 옵션 제공
   */
  const handleSaveError = (error: unknown) => {
    let errorTitle = '저장 실패';
    let errorMessage = '저장 중 오류가 발생했습니다.';
    let showRetry = true;

    // 에러 타입 분석
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // 파일 시스템 오류
      if (errorMsg.includes('file') || errorMsg.includes('image') || errorMsg.includes('directory')) {
        errorTitle = '이미지 저장 실패';
        errorMessage = '이미지 저장에 실패했습니다.\n저장 공간을 확인해주세요.';
        console.error('[FileSystem Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      // 데이터베이스 오류
      else if (errorMsg.includes('database') || errorMsg.includes('sql') || errorMsg.includes('insert')) {
        errorTitle = '데이터베이스 오류';
        errorMessage = '영수증 저장에 실패했습니다.\n잠시 후 다시 시도해주세요.';
        console.error('[Database Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      // 네트워크 오류 (향후 클라우드 동기화를 위한 준비)
      else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('timeout')) {
        errorTitle = '네트워크 오류';
        errorMessage = '네트워크 연결을 확인해주세요.';
        console.error('[Network Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      // 권한 오류
      else if (errorMsg.includes('permission') || errorMsg.includes('access denied')) {
        errorTitle = '권한 오류';
        errorMessage = '파일 접근 권한이 없습니다.\n앱 권한을 확인해주세요.';
        showRetry = false; // 권한 오류는 재시도해도 소용없음
        console.error('[Permission Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      // 일반 오류
      else {
        console.error('[Unknown Error]', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Error 객체가 아닌 경우
      console.error('[Non-Error Exception]', {
        error: JSON.stringify(error),
        timestamp: new Date().toISOString(),
      });
    }

    // 에러 알림 표시
    const buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [];

    // 재시도 버튼 (권한 오류가 아닌 경우에만)
    if (showRetry) {
      buttons.push({
        text: '재시도',
        onPress: () => handleSave(),
      });
    }

    // 취소 버튼
    buttons.push({
      text: '취소',
      style: 'cancel',
    });

    Alert.alert(errorTitle, errorMessage, buttons);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 헤더 */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="뒤로 가기"
          disabled={isSaving}
        >
          <Ionicons name="arrow-back" size={24} color={isSaving ? "#9CA3AF" : "#111827"} />
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
          {/* 이미지 썸네일 및 수동 선택 버튼 */}
          {imageUri && (
            <View className="mb-4">
              <TouchableOpacity
                onPress={() => setShowImageModal(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: imageUri }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                  accessibilityLabel="영수증 이미지"
                />
                <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded flex-row items-center">
                  <Ionicons name="expand-outline" size={14} color="#fff" />
                  <Text className="text-white text-xs ml-1">크게 보기</Text>
                </View>
              </TouchableOpacity>

              {/* 수동 선택 버튼 */}
              {ocrBlocks.length > 0 && !isLoading && (
                <TouchableOpacity
                  onPress={() => setShowOcrOverlay(true)}
                  className="mt-2 flex-row items-center justify-center py-2 bg-blue-50 border border-blue-200 rounded-lg"
                  activeOpacity={0.7}
                >
                  <Ionicons name="scan-outline" size={18} color="#2563EB" />
                  <Text className="ml-2 text-blue-600 font-medium">
                    텍스트 영역에서 직접 선택
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="mt-2 text-gray-500">OCR 분석 중...</Text>
            </View>
          ) : (
            <>
              {/* Mock 모드 안내 배너 */}
              {isMockMode && (
                <View className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="flask" size={20} color="#D97706" />
                    <Text className="ml-2 text-amber-700 font-semibold">테스트 모드</Text>
                  </View>
                  <Text className="text-amber-600 text-sm">
                    Expo Go에서는 실제 OCR이 작동하지 않습니다.{'\n'}
                    샘플 데이터로 UI를 테스트하고 있습니다.
                  </Text>
                  <Text className="text-amber-600 text-sm mt-2">
                    실제 OCR을 사용하려면:{'\n'}
                    • Development Build 생성 (npx expo prebuild){'\n'}
                    • 또는 Google Vision API 키 설정
                  </Text>
                </View>
              )}

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
            title={isSaving ? '저장 중...' : '저장'}
            onPress={handleSave}
            variant="primary"
            disabled={!amount || !date || isSaving}
            loading={isSaving}
          />
        </View>
      </KeyboardAvoidingView>

      {/* 이미지 전체 화면 모달 */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View className="flex-1 bg-black">
          {/* 닫기 버튼 */}
          <SafeAreaView className="absolute top-0 left-0 right-0 z-10">
            <View className="flex-row justify-between items-center p-4">
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white text-base font-medium">영수증 이미지</Text>
              <View className="w-10" />
            </View>
          </SafeAreaView>

          {/* 전체 화면 이미지 */}
          {imageUri && (
            <View className="flex-1 items-center justify-center">
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: Dimensions.get('window').width,
                  height: Dimensions.get('window').height * 0.8,
                }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* 하단 안내 */}
          <SafeAreaView className="absolute bottom-0 left-0 right-0">
            <View className="p-4 items-center">
              <Text className="text-gray-400 text-sm">화면을 탭하면 닫힙니다</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* OCR 텍스트 선택 오버레이 모달 */}
      <Modal
        visible={showOcrOverlay}
        animationType="slide"
        onRequestClose={() => setShowOcrOverlay(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity
              onPress={() => setShowOcrOverlay(false)}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              텍스트 영역 선택
            </Text>
            <TouchableOpacity
              onPress={() => setShowOcrOverlay(false)}
              className="px-3 py-1"
            >
              <Text className="text-blue-600 font-medium">완료</Text>
            </TouchableOpacity>
          </View>

          {/* 안내 문구 */}
          <View className="px-4 py-2 bg-blue-50">
            <Text className="text-sm text-blue-700 text-center">
              박스를 탭하여 상호명, 금액, 날짜를 선택하세요
            </Text>
          </View>

          {/* 선택된 항목 표시 */}
          {selectedItems.length > 0 && (
            <View className="flex-row px-4 py-2 gap-2 bg-gray-50">
              {selectedItems.map((item) => (
                <View
                  key={item.lineIndex}
                  className="px-3 py-1 rounded-full flex-row items-center"
                  style={{
                    backgroundColor: item.mode === 'storeName' ? '#DBEAFE' :
                                   item.mode === 'amount' ? '#D1FAE5' : '#FEF3C7'
                  }}
                >
                  <Text className="text-xs font-medium" style={{
                    color: item.mode === 'storeName' ? '#1D4ED8' :
                           item.mode === 'amount' ? '#047857' : '#B45309'
                  }}>
                    {item.mode === 'storeName' ? '상호명' :
                     item.mode === 'amount' ? '금액' : '날짜'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* OCR 오버레이 */}
          {imageUri && imageSize.width > 0 && (
            <OcrOverlay
              imageUri={imageUri}
              blocks={ocrBlocks}
              imageSize={imageSize}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onDeselectItem={handleDeselectItem}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
