/**
 * Custom Field Management Screen
 *
 * Features:
 * - List all custom fields with their types and entity types
 * - Create new custom field
 * - Edit custom field (name, type, options, required status)
 * - Delete custom field (with usage check)
 * - Show usage count
 * - Filter by entity type
 * - Search fields
 * - Reorder fields
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Header, Input, Button, FullScreenModal, FloatingActionBar } from '@/components/common';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getCustomFieldUsageCount,
  isCustomFieldInUse,
} from '@/services/database/customFieldService';
import type { CustomField, CustomFieldType } from '@/types/customField';

interface CustomFieldWithCount extends CustomField {
  usageCount: number;
}

// Field type options with icons
const FIELD_TYPES: { value: CustomFieldType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'text', label: '텍스트', icon: 'text-outline' },
  { value: 'number', label: '숫자', icon: 'calculator-outline' },
  { value: 'date', label: '날짜', icon: 'calendar-outline' },
  { value: 'select', label: '선택', icon: 'list-outline' },
];

// Filter options - only current valid types
const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'item', label: '항목' },
];

export default function CustomFieldsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fields, setFields] = useState<CustomFieldWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldWithCount | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [optionsText, setOptionsText] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const primaryColor = useThemeColor('#3B82F6', '#60A5FA');
  const purpleColor = useThemeColor('#8B5CF6', '#A78BFA');
  const grayIconColor = useThemeColor('#6B7280', '#9CA3AF');
  const lightGrayColor = useThemeColor('#D1D5DB', '#4B5563');
  const dangerColor = useThemeColor('#EF4444', '#F87171');
  const placeholderColor = useThemeColor('#9CA3AF', '#6B7280');

  // Load custom fields when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadCustomFields();
    }, [])
  );

  const loadCustomFields = async () => {
    setIsLoading(true);
    try {
      const loadedFields = await getCustomFields();

      // Load usage counts for each field
      const fieldsWithCounts: CustomFieldWithCount[] = await Promise.all(
        loadedFields.map(async (field) => {
          const usageCount = await getCustomFieldUsageCount(field.id);
          return { ...field, usageCount };
        })
      );

      setFields(fieldsWithCounts);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      Alert.alert('오류', '커스텀 필드를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search fields
  const filteredFields = fields.filter((field) => {
    if (selectedFilter !== 'all' && field.entityType !== selectedFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      return field.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  // Open create modal
  const handleOpenCreateModal = () => {
    setFieldName('');
    setFieldType('text');
    setIsRequired(false);
    setOptionsText('');
    setShowCreateModal(true);
  };

  // Open edit modal
  const handleOpenEditModal = (field: CustomFieldWithCount) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldType(field.fieldType);
    setIsRequired(field.isRequired);
    setOptionsText(field.options?.join('\n') || '');
    setShowEditModal(true);
  };

  // Create new custom field
  const handleCreateField = async () => {
    if (!fieldName.trim()) {
      Alert.alert('오류', '필드 이름을 입력해주세요.');
      return;
    }

    // Check if field name already exists
    const existingField = fields.find(
      (f) => f.name.toLowerCase() === fieldName.trim().toLowerCase()
    );

    if (existingField) {
      Alert.alert('오류', '이미 존재하는 필드 이름입니다.');
      return;
    }

    // Validate options for select type
    if (fieldType === 'select') {
      const options = optionsText
        .split('\n')
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

      if (options.length === 0) {
        Alert.alert('오류', '선택 필드는 최소 1개 이상의 옵션이 필요합니다.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const options =
        fieldType === 'select'
          ? optionsText
              .split('\n')
              .map((opt) => opt.trim())
              .filter((opt) => opt.length > 0)
          : undefined;

      // Get max display order
      const maxOrder = fields.reduce((max, f) => Math.max(max, f.displayOrder), -1);

      const newField = await createCustomField({
        name: fieldName.trim(),
        fieldType,
        options,
        isRequired,
        entityType: 'item',
        displayOrder: maxOrder + 1,
      });

      // Reload to get updated list
      await loadCustomFields();
      setShowCreateModal(false);
      Alert.alert('성공', '커스텀 필드가 생성되었습니다.');
    } catch (error) {
      console.error('Failed to create custom field:', error);
      Alert.alert(
        '오류',
        error instanceof Error ? error.message : '커스텀 필드를 생성할 수 없습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Update custom field
  const handleUpdateField = async () => {
    if (!editingField) return;

    if (!fieldName.trim()) {
      Alert.alert('오류', '필드 이름을 입력해주세요.');
      return;
    }

    // Check if field name already exists (excluding current field)
    const existingField = fields.find(
      (f) =>
        f.id !== editingField.id &&
        f.name.toLowerCase() === fieldName.trim().toLowerCase()
    );

    if (existingField) {
      Alert.alert('오류', '이미 존재하는 필드 이름입니다.');
      return;
    }

    // Validate options for select type
    if (fieldType === 'select') {
      const options = optionsText
        .split('\n')
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

      if (options.length === 0) {
        Alert.alert('오류', '선택 필드는 최소 1개 이상의 옵션이 필요합니다.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const options =
        fieldType === 'select'
          ? optionsText
              .split('\n')
              .map((opt) => opt.trim())
              .filter((opt) => opt.length > 0)
          : undefined;

      await updateCustomField(editingField.id, {
        name: fieldName.trim(),
        fieldType,
        options,
        isRequired,
        // Note: We're not allowing entity type change to avoid orphaned data
      });

      // Reload to get updated data
      await loadCustomFields();
      setShowEditModal(false);
      Alert.alert('성공', '커스텀 필드가 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update custom field:', error);
      Alert.alert(
        '오류',
        error instanceof Error ? error.message : '커스텀 필드를 수정할 수 없습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete custom field
  const handleDeleteField = async (field: CustomFieldWithCount) => {
    const usageCount = field.usageCount;

    if (usageCount > 0) {
      Alert.alert(
        '삭제 불가',
        `이 필드는 ${usageCount}개의 항목에서 사용 중입니다.\n사용 중인 필드는 삭제할 수 없습니다.`
      );
      return;
    }

    Alert.alert(
      '커스텀 필드 삭제',
      '이 커스텀 필드를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => confirmDeleteField(field),
        },
      ]
    );
  };

  const confirmDeleteField = async (field: CustomFieldWithCount) => {
    setIsLoading(true);
    try {
      await deleteCustomField(field.id);
      await loadCustomFields();
      Alert.alert('성공', '커스텀 필드가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete custom field:', error);
      Alert.alert(
        '오류',
        error instanceof Error ? error.message : '커스텀 필드를 삭제할 수 없습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reorder fields
  const handleReorder = async (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex((f) => f.id === fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    try {
      // Swap display orders
      const currentField = fields[currentIndex];
      const swapField = fields[newIndex];

      await updateCustomField(currentField.id, {
        displayOrder: swapField.displayOrder,
      });

      await updateCustomField(swapField.id, {
        displayOrder: currentField.displayOrder,
      });

      // Reload to get updated order
      await loadCustomFields();
    } catch (error) {
      console.error('Failed to reorder fields:', error);
      Alert.alert('오류', '필드 순서를 변경할 수 없습니다.');
    }
  };

  // Get field type icon and label
  const getFieldTypeInfo = (type: CustomFieldType) => {
    return FIELD_TYPES.find((t) => t.value === type) || FIELD_TYPES[0];
  };

  // Render field item
  const renderFieldItem = (field: CustomFieldWithCount, index: number) => {
    const typeInfo = getFieldTypeInfo(field.fieldType);

    return (
      <View
        key={field.id}
        className="py-3 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      >
        <View className="flex-row items-start">
          {/* Field type icon */}
          <View className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg items-center justify-center mr-3">
            <Ionicons name={typeInfo.icon} size={20} color={purpleColor} />
          </View>

          {/* Field info */}
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-2">
              <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                {field.name}
              </Text>
              {field.isRequired && (
                <View className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">
                  <Text className="text-xs font-medium text-red-700 dark:text-red-400">필수</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-1 flex-wrap gap-2">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {typeInfo.label}
              </Text>
              {field.usageCount > 0 && (
                <>
                  <Text className="text-sm text-gray-400 dark:text-gray-500">•</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {field.usageCount}개 항목에서 사용 중
                  </Text>
                </>
              )}
            </View>
            {field.fieldType === 'select' && field.options && (
              <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1" numberOfLines={1}>
                옵션: {field.options.join(', ')}
              </Text>
            )}
          </View>

          {/* Action buttons */}
          <View className="flex-row items-center ml-2">
            {/* Reorder buttons */}
            <View className="mr-2">
              <TouchableOpacity
                onPress={() => handleReorder(field.id, 'up')}
                className="w-7 h-7 items-center justify-center"
                activeOpacity={0.7}
                disabled={index === 0}
              >
                <Ionicons
                  name="chevron-up"
                  size={20}
                  color={index === 0 ? lightGrayColor : grayIconColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReorder(field.id, 'down')}
                className="w-7 h-7 items-center justify-center"
                activeOpacity={0.7}
                disabled={index === fields.length - 1}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={index === fields.length - 1 ? lightGrayColor : grayIconColor}
                />
              </TouchableOpacity>
            </View>

            {/* Edit button */}
            <TouchableOpacity
              onPress={() => handleOpenEditModal(field)}
              className="w-9 h-9 items-center justify-center mr-2"
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={22} color={primaryColor} />
            </TouchableOpacity>

            {/* Delete button */}
            <TouchableOpacity
              onPress={() => handleDeleteField(field)}
              className="w-9 h-9 items-center justify-center"
              activeOpacity={0.7}
              disabled={field.usageCount > 0}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={field.usageCount > 0 ? lightGrayColor : dangerColor}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render field form modal
  const renderFieldFormModal = (
    visible: boolean,
    isEdit: boolean,
    onClose: () => void,
    onSave: () => void
  ) => (
    <>
      <FullScreenModal
        visible={visible}
        onClose={onClose}
        title={isEdit ? '커스텀 필드 수정' : '새 커스텀 필드'}
        rightButton={{
          icon: 'checkmark',
          onPress: onSave,
          disabled: isSaving,
          loading: isSaving,
        }}
      >
        <View className="p-4">
          {/* Field Name */}
          <Input
            label="필드 이름"
            placeholder="예: 프로젝트 이름, 클라이언트, 인보이스 번호"
            value={fieldName}
            onChangeText={setFieldName}
            autoCapitalize="none"
          />

          {/* Field Type Picker */}
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 text-base font-medium mb-2">
              필드 타입
            </Text>
            <TouchableOpacity
              onPress={() => setShowTypePicker(true)}
              className="flex-row items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-purple-50 dark:bg-purple-900/30">
                <Ionicons
                  name={getFieldTypeInfo(fieldType).icon}
                  size={20}
                  color={purpleColor}
                />
              </View>
              <Text className="flex-1 text-gray-700 dark:text-gray-300">
                {getFieldTypeInfo(fieldType).label}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={placeholderColor} />
            </TouchableOpacity>
          </View>

          {/* Required Toggle */}
          <View className="flex-row items-center justify-between py-3 mb-4">
            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                필수 입력
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                항목 저장 시 반드시 입력해야 합니다
              </Text>
            </View>
            <Switch
              value={isRequired}
              onValueChange={setIsRequired}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={isRequired ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          {/* Options (for select type only) */}
          {fieldType === 'select' && (
            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-300 text-base font-medium mb-2">
                선택 옵션 (한 줄에 하나씩)
              </Text>
              <TextInput
                className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                placeholder="옵션 1&#10;옵션 2&#10;옵션 3"
                placeholderTextColor={placeholderColor}
                value={optionsText}
                onChangeText={setOptionsText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                각 줄에 하나씩 옵션을 입력하세요
              </Text>
            </View>
          )}

          {/* Preview */}
          <Text className="text-gray-700 dark:text-gray-300 text-base font-medium mb-2">
            미리보기
          </Text>
          <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg items-center justify-center mr-3">
                <Ionicons name={getFieldTypeInfo(fieldType).icon} size={20} color={purpleColor} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {fieldName || '필드 이름'}
                  </Text>
                  {isRequired && (
                    <View className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">
                      <Text className="text-xs font-medium text-red-700 dark:text-red-400">
                        필수
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {getFieldTypeInfo(fieldType).label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </FullScreenModal>

      {/* Type picker modal */}
      <FullScreenModal
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="필드 타입 선택"
        scrollable={false}
      >
        <View className="flex-1">
            {FIELD_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => {
                  setFieldType(type.value);
                  setShowTypePicker(false);
                }}
                className="flex-row items-center py-4 px-4 border-b border-gray-200 dark:border-gray-700"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-purple-50 dark:bg-purple-900/30">
                  <Ionicons name={type.icon} size={20} color={purpleColor} />
                </View>
                <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">
                  {type.label}
                </Text>
                {fieldType === type.value && (
                  <Ionicons name="checkmark" size={24} color={primaryColor} />
                )}
              </TouchableOpacity>
            ))}
          </View>
      </FullScreenModal>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="커스텀 필드 관리" showBack={true} />
      <View className="flex-1 bg-white dark:bg-gray-900">
        {/* Search bar */}
        <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color={grayIconColor} />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900 dark:text-gray-100"
            placeholder="필드 검색"
            placeholderTextColor={placeholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={grayIconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedFilter(option.value)}
                className={`px-4 py-2 rounded-full ${
                  selectedFilter === option.value
                    ? 'bg-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedFilter === option.value
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Fields list */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-2 text-gray-600 dark:text-gray-400">로딩 중...</Text>
        </View>
      ) : filteredFields.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="create-outline" size={64} color={lightGrayColor} />
          <Text className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {searchQuery || selectedFilter !== 'all'
              ? '검색 결과가 없습니다'
              : '커스텀 필드가 없습니다'}
          </Text>
          <Text className="mt-2 text-gray-500 dark:text-gray-400 text-center">
            {searchQuery || selectedFilter !== 'all'
              ? '다른 검색어나 필터를 시도해보세요'
              : '새 커스텀 필드를 만들어 항목에 추가 정보를 기록하세요'}
          </Text>
          {!searchQuery && selectedFilter === 'all' && (
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              className="mt-6 px-6 py-3 bg-blue-600 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold">새 커스텀 필드 만들기</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Field count */}
          <View className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              총 {filteredFields.length}개의 필드
            </Text>
          </View>

          {/* Field list */}
          {filteredFields.map((field, index) => renderFieldItem(field, index))}
        </ScrollView>
      )}

      {/* Create field modal */}
      {renderFieldFormModal(
        showCreateModal,
        false,
        () => setShowCreateModal(false),
        handleCreateField
      )}

      {/* Edit field modal */}
      {renderFieldFormModal(
        showEditModal,
        true,
        () => setShowEditModal(false),
        handleUpdateField
      )}
      </View>

      <FloatingActionBar
        bottomInset={insets.bottom}
        actions={[
          {
            icon: 'add',
            onPress: handleOpenCreateModal,
            variant: 'primary',
          },
        ]}
      />
    </>
  );
}
