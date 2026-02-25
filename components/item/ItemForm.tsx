/**
 * ItemForm - Unified form component for adding/editing items
 *
 * Combines receipt and document functionality with dynamic fields
 * that show/hide based on classification type.
 *
 * Features:
 * - Classification selector (personal_card, corporate_card, proof_document)
 * - Usage purpose selector (meal, other)
 * - Image picker (camera or gallery)
 * - OCR text extraction and auto-fill
 * - Manual text selection via OcrOverlay
 * - Dynamic fields based on classification
 * - Form validation
 * - Loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpaceStore } from '@/store/spaceStore';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { DEFAULT_CLASSIFICATION_IDS } from '@/services/database/migrations/spaceFeature';
// 날짜 유효성 검사 (YYYY-MM-DD 형식 + 실제 존재하는 날짜)
function isValidDateFormat(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// OCR 텍스트에서 날짜 파싱 → YYYY-MM-DD 반환, 실패 시 null
function parseDateFromOcrText(text: string): string | null {
  const cleaned = text.trim();

  // 한국어 포맷: 2025년 1월 15일, 2025년01월15일
  const koreanMatch = cleaned.match(/(\d{4})[년]\s*(\d{1,2})[월]\s*(\d{1,2})[일]?/);
  if (koreanMatch) {
    const candidate = `${koreanMatch[1]}-${koreanMatch[2].padStart(2, '0')}-${koreanMatch[3].padStart(2, '0')}`;
    if (isValidDateFormat(candidate)) return candidate;
  }

  // 구분자 포맷: YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD, YY.MM.DD 등
  const sepMatch = cleaned.match(/(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  if (sepMatch) {
    let year = sepMatch[1];
    if (year.length === 2) {
      const y = parseInt(year, 10);
      year = y >= 50 ? '19' + year : '20' + year;
    }
    const candidate = `${year}-${sepMatch[2].padStart(2, '0')}-${sepMatch[3].padStart(2, '0')}`;
    if (isValidDateFormat(candidate)) return candidate;
  }

  return null;
}

// 금액 콤마 포맷
function formatAmountDisplay(raw: string): string {
  if (!raw) return '';
  const num = parseInt(raw, 10);
  return isNaN(num) ? '' : num.toLocaleString('ko-KR');
}
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
import { Input, BottomSheet, FullScreenModal, DatePickerInput } from '@/components/common';
import { ClassificationSelector } from './ClassificationSelector';
import { UsagePurposeSelector } from './UsagePurposeSelector';
import { TagSelector } from './TagSelector';
import { CustomFieldInput } from './CustomFieldInput';
import { OcrOverlay, type SelectedItem } from './OcrOverlay';
import {
  extractReceiptData,
  extractTextDetailed,
  OcrErrorType,
  ocrLogger,
  getCurrentProvider,
} from '@/services/ocr';
import { getCustomFields } from '@/services/database/customFieldService';
import type { OcrError, OcrBlock } from '@/services/ocr';
import type { CreateItemInput } from '@/types/item';
import type { ItemClassification, UsagePurpose } from '@/types/shared';
import { colors } from '@/design-system/tokens/colors';
import type { Tag } from '@/types/tag';
import type { CustomField } from '@/types';

interface ItemFormProps {
  /** Initial form data for edit mode (optional) */
  initialData?: Partial<CreateItemInput>;
  /** Pre-populated tags for edit mode (Tag objects, not IDs) */
  initialTags?: Tag[];
  /** Pre-populated custom field values for edit mode */
  initialCustomValues?: Record<string, string | null>;
  /** Pre-captured image URI for OCR processing */
  imageUri?: string;
  /** Callback when form is submitted successfully */
  onSubmit: (data: CreateItemInput) => Promise<void>;
  /** Callback when cancel button is pressed (optional) */
  onCancel?: () => void;
}

export function ItemForm({
  initialData,
  initialTags,
  initialCustomValues,
  imageUri: initialImageUri,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const modalTitle = initialData ? '항목 수정' : '항목 추가';
  const { currentSpace } = useSpaceStore();

  // Theme colors for icons and indicators
  const surfaceColor = useThemeColor(colors.light.surface, colors.dark.surface);
  const primaryColor = useThemeColor(colors.primary, '#60A5FA');
  const successColor = useThemeColor(colors.success, '#34D399');
  const warningColor = useThemeColor(colors.warning, '#FCD34D');
  const errorColor = useThemeColor(colors.error, '#F87171');
  const orangeColor = useThemeColor('#EA580C', '#FB923C');
  const ocrBadgeBlueColor = useThemeColor('#DBEAFE', '#1E3A5F');
  const ocrBadgeGreenColor = useThemeColor('#D1FAE5', '#14532D');
  const ocrBadgeYellowColor = useThemeColor('#FEF3C7', '#451A03');

  // classificationId (DB 기반 Classification ID)
  const [classificationId, setClassificationId] = useState<string | undefined>(
    initialData?.classificationId
  );
  // Form state
  const [classification, setClassification] = useState<ItemClassification>(
    initialData?.classification || 'corporate_card'
  );
  const [usagePurpose, setUsagePurpose] = useState<UsagePurpose>(
    initialData?.usagePurpose ?? ''
  );
  const [imageUri, setImageUri] = useState<string | null>(
    initialImageUri || initialData?.filePath || null
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
  const [ocrText, setOcrText] = useState(initialData?.ocrText || '');
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags ?? []);

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string | null>>({});

  // UI state
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OCR state
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<OcrError | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isMockMode, setIsMockMode] = useState(false);
  const [showOcrOverlay, setShowOcrOverlay] = useState(false);
  const [ocrBlocks, setOcrBlocks] = useState<OcrBlock[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // BottomSheet state
  const [showImagePicker, setShowImagePicker] = useState(false);

  // handleOcrErrorAlert를 runOCR에서 순환 참조 없이 호출하기 위한 ref
  const handleOcrErrorAlertRef = useRef<(error: OcrError) => void>(() => {});

  // Dynamic field visibility based on classification
  const showAmount = classification !== 'proof_document';
  const showStoreName =
    classification === 'personal_card' || classification === 'corporate_card';

  /**
   * Handle classification ID change and sync the classification enum accordingly
   */
  const handleClassificationChange = (id: string) => {
    setClassificationId(id);
    if (id === DEFAULT_CLASSIFICATION_IDS.personalCard) {
      setClassification('personal_card');
    } else if (id === DEFAULT_CLASSIFICATION_IDS.proofDocument) {
      setClassification('proof_document');
    } else {
      // 커스텀 분류 또는 법인카드 → corporate_card 기본값
      setClassification('corporate_card');
    }
  };

  /**
   * Load custom fields for items
   */
  const loadCustomFields = async () => {
    try {
      const fields = await getCustomFields();
      setCustomFields(fields);

      // Initialize custom values from initialCustomValues prop if editing
      if (initialCustomValues) {
        setCustomValues(initialCustomValues);
      }
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      Alert.alert('오류', '커스텀 필드를 불러오지 못했습니다.');
    }
  };

  /**
   * Run OCR on the provided image
   */
  const runOCR = useCallback(async (uri: string) => {
    setIsOcrLoading(true);
    setOcrError(null);

    try {
      // Get detailed OCR result (with bounding boxes)
      const detailedResult = await extractTextDetailed(uri);
      setOcrBlocks(detailedResult.blocks);
      setOcrText(detailedResult.text);

      // Get image size for overlay
      Image.getSize(
        uri,
        (width, height) => {
          setImageSize({ width, height });
        },
        (error) => {
          console.error('Failed to get image size:', error);
        }
      );

      // Get parsed receipt data
      const result = await extractReceiptData(uri);

      // Check provider (mock mode)
      const provider = getCurrentProvider();
      setIsMockMode(provider === 'mock');

      // Apply OCR results to form
      if (result.storeName) {
        setStoreName(result.storeName);
        setTitle((prev) => prev || result.storeName!);
      }
      if (result.amount) setAmount(result.amount.toString());
      if (result.date) setDate(result.date);

      setConfidence(result.confidence || 0);

      // Show warning if some fields couldn't be extracted (non-mock mode)
      if (result.warnings && result.warnings.length > 0 && provider !== 'mock') {
        Alert.alert(
          '일부 정보 추출 실패',
          `다음 정보를 찾을 수 없어 수동으로 입력해주세요:\n\n${result.warnings.join('\n')}`,
          [{ text: '확인' }]
        );
      }
    } catch (error) {
      console.error('OCR failed:', error);

      if (error && typeof error === 'object' && 'type' in error) {
        const ocrErr = error as OcrError;
        setOcrError(ocrErr);
        handleOcrErrorAlertRef.current(ocrErr);
      } else {
        Alert.alert(
          'OCR 오류',
          'OCR 처리 중 알 수 없는 오류가 발생했습니다. 수동으로 입력해주세요.',
          [{ text: '확인' }]
        );
      }
    } finally {
      setIsOcrLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Show user-friendly OCR error alert
   */
  const handleOcrErrorAlert = useCallback((error: OcrError) => {
    const buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [];

    if (error.retryable && imageUri) {
      buttons.push({
        text: '다시 시도',
        onPress: () => runOCR(imageUri),
      });
    }

    if (
      error.type === OcrErrorType.NO_TEXT_DETECTED ||
      error.type === OcrErrorType.POOR_IMAGE_QUALITY
    ) {
      buttons.push({
        text: '다시 촬영',
        onPress: () => setImageUri(null),
      });
    }

    buttons.push({
      text: '수동 입력',
      style: 'cancel',
    });

    Alert.alert(
      'OCR 처리 실패',
      `${error.userMessage}\n\n${error.suggestedAction || ''}`,
      buttons
    );

    ocrLogger.error('OCR error details', undefined, {
      type: error.type,
      userMessage: error.userMessage,
      technicalMessage: error.technicalMessage,
      recoverable: error.recoverable,
      retryable: error.retryable,
    });
  }, [imageUri, runOCR]);

  // handleOcrErrorAlertRef를 항상 최신 함수로 유지
  handleOcrErrorAlertRef.current = handleOcrErrorAlert;

  // Load custom fields on mount
  useEffect(() => {
    loadCustomFields();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run OCR when initialImageUri is provided
  useEffect(() => {
    if (initialImageUri && !initialData?.title) {
      runOCR(initialImageUri);
    }
  }, [initialImageUri, runOCR]);

  // OCR overlay item selection handler
  const handleSelectItem = (item: SelectedItem) => {
    const filtered = selectedItems.filter((i) => i.mode !== item.mode);
    setSelectedItems([...filtered, item]);

    if (item.mode === 'storeName') {
      setStoreName(item.text);
      if (!title) setTitle(item.text);
    } else if (item.mode === 'amount') {
      const numericValue = item.text.replace(/[^0-9]/g, '');
      if (numericValue) {
        setAmount(numericValue);
      } else {
        Alert.alert('변환 실패', '선택한 텍스트에서 금액을 추출할 수 없습니다.');
      }
    } else if (item.mode === 'date') {
      const parsed = parseDateFromOcrText(item.text);
      if (parsed) {
        setDate(parsed);
      } else {
        Alert.alert('변환 실패', '선택한 텍스트에서 날짜를 인식할 수 없습니다.\n직접 YYYY-MM-DD 형식으로 입력해주세요.');
      }
    }
  };

  // OCR overlay item deselection handler
  const handleDeselectItem = (lineIndex: string) => {
    const item = selectedItems.find((i) => i.lineIndex === lineIndex);
    setSelectedItems(selectedItems.filter((i) => i.lineIndex !== lineIndex));

    if (item) {
      if (item.mode === 'storeName') setStoreName('');
      else if (item.mode === 'amount') setAmount('');
      else if (item.mode === 'date') setDate('');
    }
  };

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
        const uri = result.assets[0].uri;
        setImageUri(uri);
        // Run OCR on captured image
        runOCR(uri);
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
        const uri = result.assets[0].uri;
        setImageUri(uri);
        // Run OCR on selected image
        runOCR(uri);
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
        onPress: () => {
          setImageUri(null);
          setOcrBlocks([]);
          setSelectedItems([]);
          setConfidence(0);
          setOcrError(null);
        },
      },
    ]);
  };

  // Form validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }

    if (showAmount) {
      if (!amount) {
        newErrors.amount = '금액을 입력해주세요';
      } else if (!/^\d+$/.test(amount) || parseInt(amount, 10) <= 0) {
        newErrors.amount = '유효한 금액을 입력해주세요 (양의 정수)';
      }
    }

    if (!date) {
      newErrors.date = '날짜를 입력해주세요';
    } else if (!isValidDateFormat(date)) {
      newErrors.date = '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!currentSpace) {
      Alert.alert('오류', '공간을 먼저 선택해주세요.');
      return;
    }

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
        ocrText: ocrText || undefined,
        spaceId: currentSpace?.id,
        classificationId: classificationId,
      };

      // Add amount for expense items
      if (showAmount && amount) {
        itemData.amount = parseInt(amount);
      }

      // Add storeName for receipt items
      if (showStoreName && storeName.trim()) {
        itemData.storeName = storeName.trim();
      }

      // Add tags (as IDs)
      if (selectedTags.length > 0) {
        itemData.tags = selectedTags.map(tag => tag.id);
      }

      // Add custom field values
      if (Object.keys(customValues).length > 0) {
        itemData.customValues = customValues;
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
    <FullScreenModal
      visible={true}
      onClose={onCancel || (() => {})}
      title={modalTitle}
      rightButton={{
        icon: 'checkmark',
        onPress: handleSubmit,
        disabled: isSaving || isOcrLoading,
        loading: isSaving,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Classification Selector */}
        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-200 text-base font-medium mb-3">
            분류 (필수)
          </Text>
          {currentSpace ? (
            <ClassificationSelector
              spaceId={currentSpace.id}
              value={classificationId}
              onChange={handleClassificationChange}
            />
          ) : (
            <Text className="text-gray-500 dark:text-gray-400 text-sm py-2">
              공간을 먼저 선택해주세요
            </Text>
          )}
        </View>

        {/* Usage Purpose Selector */}
        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-200 text-base font-medium mb-3">
            용도 (필수)
          </Text>
          <UsagePurposeSelector
            selectedPurpose={usagePurpose}
            onSelect={setUsagePurpose}
            spaceId={currentSpace?.id}
          />
        </View>

        {/* Image/File Picker with OCR */}
        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-200 text-base font-medium mb-3">
            사진 (선택)
          </Text>

          {imageUri ? (
            <View className="relative">
              <TouchableOpacity
                onPress={() => ocrBlocks.length > 0 && setShowOcrOverlay(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: imageUri }}
                  className="w-full h-48 rounded-lg bg-gray-100"
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* Delete button */}
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
                <Ionicons name="close" size={20} color={surfaceColor} />
              </TouchableOpacity>

              {/* OCR Loading indicator */}
              {isOcrLoading && (
                <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                  <ActivityIndicator size="large" color={surfaceColor} />
                  <Text className="text-white mt-2 font-medium">OCR 분석 중...</Text>
                </View>
              )}

              {/* Manual selection button */}
              {ocrBlocks.length > 0 && !isOcrLoading && (
                <TouchableOpacity
                  onPress={() => setShowOcrOverlay(true)}
                  className="mt-2 flex-row items-center justify-center py-2 bg-blue-50 border border-blue-200 rounded-lg"
                  activeOpacity={0.7}
                >
                  <Ionicons name="scan-outline" size={18} color={primaryColor} />
                  <Text className="ml-2 text-blue-600 font-medium">
                    텍스트 영역에서 직접 선택
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowImagePicker(true)}
              disabled={isLoadingImage}
              className="py-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 border-dashed rounded-lg items-center justify-center"
              activeOpacity={0.7}
            >
              {isLoadingImage ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color={primaryColor} />
                  <Text className="text-blue-600 dark:text-blue-400 font-medium mt-2">
                    사진 등록
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Mock mode banner */}
        {isMockMode && (
          <View className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <View className="flex-row items-center mb-2">
              <Ionicons name="flask" size={20} color={warningColor} />
              <Text className="ml-2 text-amber-700 font-semibold">테스트 모드</Text>
            </View>
            <Text className="text-amber-600 text-sm">
              Expo Go에서는 실제 OCR이 작동하지 않습니다.{'\n'}
              샘플 데이터로 UI를 테스트하고 있습니다.
            </Text>
          </View>
        )}

        {/* OCR confidence indicator */}
        {ocrError ? (
          <View className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={20} color={errorColor} />
              <Text className="ml-2 text-red-700 font-semibold">OCR 처리 실패</Text>
            </View>
            <Text className="text-red-600 text-sm">{ocrError.userMessage}</Text>
            {ocrError.suggestedAction && (
              <Text className="mt-2 text-red-600 text-sm">
                {ocrError.suggestedAction}
              </Text>
            )}
          </View>
        ) : (
          confidence > 0 && (
            <View
              className={`mb-4 p-4 rounded-lg border ${
                confidence >= 0.7
                  ? 'bg-green-50 border-green-200'
                  : confidence >= 0.4
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name={
                      confidence >= 0.7 ? 'checkmark-circle' : 'information-circle'
                    }
                    size={20}
                    color={
                      confidence >= 0.7
                        ? successColor
                        : confidence >= 0.4
                        ? warningColor
                        : orangeColor
                    }
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      confidence >= 0.7
                        ? 'text-green-700'
                        : confidence >= 0.4
                        ? 'text-yellow-700'
                        : 'text-orange-700'
                    }`}
                  >
                    {confidence >= 0.7
                      ? 'OCR 성공'
                      : confidence >= 0.4
                      ? '일부 정보 추출'
                      : '수동 입력 필요'}
                  </Text>
                </View>
                <Text
                  className={`text-sm ${
                    confidence >= 0.7
                      ? 'text-green-600'
                      : confidence >= 0.4
                      ? 'text-yellow-600'
                      : 'text-orange-600'
                  }`}
                >
                  {Math.round(confidence * 100)}%
                </Text>
              </View>
              {confidence < 0.7 && (
                <Text
                  className={`mt-2 text-sm ${
                    confidence >= 0.4 ? 'text-yellow-700' : 'text-orange-700'
                  }`}
                >
                  누락된 정보를 직접 입력해주세요
                </Text>
              )}
            </View>
          )
        )}

        {/* Title Input */}
        <Input
          label="제목 (필수)"
          value={title}
          onChangeText={setTitle}
          placeholder="제목"
          autoCapitalize="sentences"
          error={errors.title}
        />

        {/* Date Input - Common field, always visible */}
        <DatePickerInput
          label="날짜 (필수)"
          value={date}
          onChange={setDate}
          error={errors.date}
        />

        {/* Amount Input - Conditional */}
        {showAmount && (
          <Input
            label="금액 (필수)"
            value={formatAmountDisplay(amount)}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
            placeholder="예: 50,000"
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

        {/* Memo Input */}
        <Input
          label="메모 (선택)"
          value={memo}
          onChangeText={setMemo}
          placeholder="메모"
          multiline
          numberOfLines={4}
        />

        {/* Tags Section */}
        <View className="mb-6">
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            label="태그 (선택)"
            spaceId={currentSpace?.id}
          />
        </View>

        {/* Custom Fields Section */}
        {customFields.length > 0 && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">추가 정보</Text>
            {customFields.map((field) => (
              <CustomFieldInput
                key={field.id}
                field={field}
                value={customValues[field.id] || null}
                onValueChange={(value) => {
                  setCustomValues(prev => ({ ...prev, [field.id]: value }));
                }}
              />
            ))}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker BottomSheet */}
      <BottomSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        title="사진 등록"
        options={[
          {
            label: '사진 찍기',
            icon: 'camera',
            onPress: takePhoto,
          },
          {
            label: '갤러리에서 선택',
            icon: 'images',
            onPress: pickImage,
          },
        ]}
      />

      {/* OCR Text Selection Overlay Modal */}
      <FullScreenModal
        visible={showOcrOverlay}
        onClose={() => setShowOcrOverlay(false)}
        title="텍스트 영역 선택"
        rightButton={{
          icon: 'checkmark',
          onPress: () => setShowOcrOverlay(false),
        }}
        scrollable={false}
      >
        <View className="flex-1">
          {/* Instructions */}
          <View className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30">
            <Text className="text-sm text-blue-700 dark:text-blue-400 text-center">
              박스를 탭하여 상호명, 금액, 날짜를 선택하세요
            </Text>
          </View>

          {/* Selected items display */}
          {selectedItems.length > 0 && (
            <View className="flex-row px-4 py-2 gap-2 bg-gray-50 dark:bg-gray-800">
              {selectedItems.map((item) => (
                <View
                  key={item.lineIndex}
                  className="px-3 py-1 rounded-full flex-row items-center"
                  style={{
                    backgroundColor:
                      item.mode === 'storeName'
                        ? ocrBadgeBlueColor
                        : item.mode === 'amount'
                        ? ocrBadgeGreenColor
                        : ocrBadgeYellowColor,
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color:
                        item.mode === 'storeName'
                          ? primaryColor
                          : item.mode === 'amount'
                          ? successColor
                          : warningColor,
                    }}
                  >
                    {item.mode === 'storeName'
                      ? '상호명'
                      : item.mode === 'amount'
                      ? '금액'
                      : '날짜'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* OCR Overlay */}
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
        </View>
      </FullScreenModal>
    </FullScreenModal>
  );
}
