/**
 * Usage Purpose Management Screen
 *
 * Features:
 * - List all usage purposes with their icons, colors, and names
 * - Create new usage purpose
 * - Edit usage purpose (name, icon, color, active status)
 * - Delete usage purpose (with validation)
 * - Show usage count
 * - Search/filter purposes
 * - Toggle active/inactive status
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
import { IconPicker } from '@/components/common/IconPicker';
import { ColorPicker, COLORS } from '@/components/common/ColorPicker';
import {
  getUsagePurposeStatistics,
  createUsagePurpose,
  updateUsagePurpose,
  deleteUsagePurpose,
  toggleUsagePurposeActive,
} from '@/services/database/usagePurposeService';
import { isDefaultUsagePurpose } from '@/types/usagePurpose';
import type { UsagePurpose } from '@/types/usagePurpose';
import { useSpaceStore } from '@/store/spaceStore';

interface UsagePurposeWithCount extends UsagePurpose {
  usageCount: number;
}

export default function UsagePurposeManagementScreen() {
  const router = useRouter();
  const { currentSpace } = useSpaceStore();
  const [purposes, setPurposes] = useState<UsagePurposeWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingPurpose, setEditingPurpose] = useState<UsagePurposeWithCount | null>(null);
  const [purposeName, setPurposeName] = useState('');
  const [purposeNameEn, setPurposeNameEn] = useState('');
  const [purposeIcon, setPurposeIcon] = useState<string>('pricetag');
  const [purposeColor, setPurposeColor] = useState(COLORS[0].value);
  const [purposeActive, setPurposeActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load usage purposes when screen is focused or current space changes
  useFocusEffect(
    useCallback(() => {
      loadUsagePurposes();
    }, [currentSpace?.id])
  );

  const loadUsagePurposes = async () => {
    setIsLoading(true);
    try {
      const loadedPurposes = await getUsagePurposeStatistics(currentSpace?.id);
      setPurposes(loadedPurposes);
    } catch (error) {
      console.error('Failed to load usage purposes:', error);
      Alert.alert('오류', '사용처를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter purposes by search query
  const filteredPurposes = purposes.filter(
    (purpose) =>
      purpose.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (purpose.nameEn?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Open create modal
  const handleOpenCreateModal = () => {
    setPurposeName('');
    setPurposeNameEn('');
    setPurposeIcon('pricetag');
    setPurposeColor(COLORS[0].value);
    setPurposeActive(true);
    setShowCreateModal(true);
  };

  // Open edit modal
  const handleOpenEditModal = (purpose: UsagePurposeWithCount) => {
    setEditingPurpose(purpose);
    setPurposeName(purpose.name);
    setPurposeNameEn(purpose.nameEn || '');
    setPurposeIcon(purpose.icon || 'pricetag');
    setPurposeColor(purpose.color || COLORS[0].value);
    setPurposeActive(purpose.isActive);
    setShowEditModal(true);
  };

  // Create new usage purpose
  const handleCreatePurpose = async () => {
    if (!purposeName.trim()) {
      Alert.alert('오류', '사용처 이름을 입력해주세요.');
      return;
    }

    // Check if purpose already exists
    const existingPurpose = purposes.find(
      (p) => p.name.toLowerCase() === purposeName.trim().toLowerCase()
    );

    if (existingPurpose) {
      Alert.alert('오류', '이미 존재하는 사용처입니다.');
      return;
    }

    setIsSaving(true);
    try {
      const newPurpose = await createUsagePurpose({
        name: purposeName.trim(),
        nameEn: purposeNameEn.trim() || undefined,
        icon: purposeIcon,
        color: purposeColor,
        spaceId: currentSpace?.id,
      });

      // Reload to get updated statistics
      await loadUsagePurposes();
      setShowCreateModal(false);
      Alert.alert('성공', '사용처가 생성되었습니다.');
    } catch (error) {
      console.error('Failed to create usage purpose:', error);
      Alert.alert(
        '오류',
        error instanceof Error ? error.message : '사용처를 생성할 수 없습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Update usage purpose
  const handleUpdatePurpose = async () => {
    if (!editingPurpose) return;

    if (!purposeName.trim()) {
      Alert.alert('오류', '사용처 이름을 입력해주세요.');
      return;
    }

    // Check if name already exists (excluding current purpose)
    const existingPurpose = purposes.find(
      (p) =>
        p.id !== editingPurpose.id &&
        p.name.toLowerCase() === purposeName.trim().toLowerCase()
    );

    if (existingPurpose) {
      Alert.alert('오류', '이미 존재하는 사용처입니다.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUsagePurpose(editingPurpose.id, {
        name: purposeName.trim(),
        nameEn: purposeNameEn.trim() || undefined,
        icon: purposeIcon,
        color: purposeColor,
        isActive: purposeActive,
      });

      // Reload to get updated data
      await loadUsagePurposes();
      setShowEditModal(false);
      Alert.alert('성공', '사용처가 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update usage purpose:', error);
      Alert.alert(
        '오류',
        error instanceof Error ? error.message : '사용처를 수정할 수 없습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete usage purpose
  const handleDeletePurpose = (purpose: UsagePurposeWithCount) => {
    if (isDefaultUsagePurpose(purpose.id)) {
      Alert.alert(
        '삭제 불가',
        '기본 사용처는 삭제할 수 없습니다.\n비활성화만 가능합니다.'
      );
      return;
    }

    const usageCount = purpose.usageCount;

    Alert.alert(
      '사용처 삭제',
      usageCount > 0
        ? `이 사용처는 ${usageCount}개의 항목에서 사용 중입니다.\n삭제하시겠습니까?`
        : '이 사용처를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => confirmDeletePurpose(purpose),
        },
      ]
    );
  };

  const confirmDeletePurpose = async (purpose: UsagePurposeWithCount) => {
    setIsLoading(true);
    try {
      await deleteUsagePurpose(purpose.id);
      await loadUsagePurposes();
      Alert.alert('성공', '사용처가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete usage purpose:', error);
      Alert.alert(
        '오류',
        error instanceof Error ? error.message : '사용처를 삭제할 수 없습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (purpose: UsagePurposeWithCount) => {
    try {
      await toggleUsagePurposeActive(purpose.id);
      await loadUsagePurposes();
    } catch (error) {
      console.error('Failed to toggle usage purpose:', error);
      Alert.alert('오류', '사용처 상태를 변경할 수 없습니다.');
    }
  };

  // Render usage purpose item
  const renderPurposeItem = (purpose: UsagePurposeWithCount) => {
    const isDefault = isDefaultUsagePurpose(purpose.id);
    const iconColor = purpose.color || '#6B7280';
    const iconName = (purpose.icon || 'pricetag') as keyof typeof Ionicons.glyphMap;

    return (
      <View
        key={purpose.id}
        className="flex-row items-center py-3 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        style={{ opacity: purpose.isActive ? 1 : 0.5 }}
      >
        {/* Icon with colored background */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: iconColor + '20' }}
        >
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        {/* Purpose info */}
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap gap-2">
            <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
              {purpose.name}
            </Text>
            {isDefault && (
              <View className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                <Text className="text-xs font-medium text-blue-700 dark:text-blue-400">기본</Text>
              </View>
            )}
            {purpose.usageCount > 0 && (
              <View className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded">
                <Text className="text-xs font-medium text-green-700 dark:text-green-400">
                  사용 중
                </Text>
              </View>
            )}
            {!purpose.isActive && (
              <View className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  비활성
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mt-0.5">
            {purpose.nameEn && (
              <Text className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                {purpose.nameEn}
              </Text>
            )}
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              {purpose.usageCount}개 항목에서 사용 중
            </Text>
          </View>
        </View>

        {/* Edit button */}
        <TouchableOpacity
          onPress={() => handleOpenEditModal(purpose)}
          className="w-9 h-9 items-center justify-center mr-2"
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={22} color="#3B82F6" />
        </TouchableOpacity>

        {/* Delete button (disabled for defaults) */}
        <TouchableOpacity
          onPress={() => handleDeletePurpose(purpose)}
          className="w-9 h-9 items-center justify-center"
          activeOpacity={0.7}
          disabled={isDefault}
        >
          <Ionicons
            name="trash-outline"
            size={22}
            color={isDefault ? '#D1D5DB' : '#EF4444'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Render purpose form modal
  const renderPurposeFormModal = (
    visible: boolean,
    isEdit: boolean,
    onClose: () => void,
    onSave: () => void
  ) => (
    <>
      <FullScreenModal
        visible={visible}
        onClose={onClose}
        title={isEdit ? '사용처 수정' : '새 사용처'}
        rightButton={{
          icon: 'checkmark',
          onPress: onSave,
          disabled: isSaving,
          loading: isSaving,
        }}
      >
        <View className="p-4">
          <Input
            label="사용처 이름 (한글)"
            placeholder="예: 식대, 교통비, 의료비"
            value={purposeName}
            onChangeText={setPurposeName}
            autoCapitalize="none"
          />

          <Input
            label="사용처 이름 (영어, 선택)"
            placeholder="예: Meal, Transportation, Medical"
            value={purposeNameEn}
            onChangeText={setPurposeNameEn}
            autoCapitalize="none"
          />

          {/* Icon picker */}
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 text-base font-medium mb-2">
              아이콘
            </Text>
            <TouchableOpacity
              onPress={() => setShowIconPicker(true)}
              className="flex-row items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: purposeColor + '20' }}
              >
                <Ionicons
                  name={purposeIcon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={purposeColor}
                />
              </View>
              <Text className="flex-1 text-gray-700 dark:text-gray-300">{purposeIcon}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Color picker */}
          <View className="mb-4">
            <ColorPicker
              selectedColor={purposeColor}
              onColorSelect={setPurposeColor}
            />
          </View>

          {/* Active toggle (only in edit mode) */}
          {isEdit && (
            <View className="flex-row items-center justify-between py-3 mb-4">
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                  활성화
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  비활성화하면 선택 목록에 표시되지 않습니다
                </Text>
              </View>
              <Switch
                value={purposeActive}
                onValueChange={setPurposeActive}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor={purposeActive ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
          )}

          {/* Preview */}
          <Text className="text-gray-700 dark:text-gray-300 text-base font-medium mb-2">
            미리보기
          </Text>
          <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: purposeColor + '20' }}
              >
                <Ionicons
                  name={purposeIcon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={purposeColor}
                />
              </View>
              <View>
                <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {purposeName || '사용처 이름'}
                </Text>
                {purposeNameEn && (
                  <Text className="text-sm text-gray-500 dark:text-gray-400">{purposeNameEn}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </FullScreenModal>

      {/* Icon picker modal */}
      <IconPicker
        visible={showIconPicker}
        selectedIcon={purposeIcon}
        onIconSelect={setPurposeIcon}
        onClose={() => setShowIconPicker(false)}
      />
    </>
  );

  if (!currentSpace) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="사용처 관리" showBack={true} />
        <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center p-6">
          <Ionicons name="business-outline" size={64} color="#D1D5DB" />
          <Text className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            공간을 먼저 선택해주세요
          </Text>
          <Text className="mt-2 text-gray-500 dark:text-gray-400 text-center">
            사용처는 공간별로 관리됩니다. 먼저 공간을 선택한 후 사용처를 관리하세요.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="사용처 관리" showBack={true} />
      <View className="flex-1 bg-white dark:bg-gray-900">
        {/* Search bar */}
        <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900 dark:text-gray-100"
            placeholder="사용처 검색"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Usage purposes list */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">로딩 중...</Text>
        </View>
      ) : filteredPurposes.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="pricetag-outline" size={64} color="#D1D5DB" />
          <Text className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {searchQuery ? '검색 결과가 없습니다' : '사용처가 없습니다'}
          </Text>
          <Text className="mt-2 text-gray-500 dark:text-gray-400 text-center">
            {searchQuery
              ? '다른 검색어를 입력해보세요'
              : '새 사용처를 만들어 항목을 체계적으로 분류하세요'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              className="mt-6 px-6 py-3 bg-blue-600 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold">
                새 사용처 만들기
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Purpose count */}
          <View className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              총 {filteredPurposes.length}개의 사용처
              {purposes.filter((p) => !p.isActive).length > 0 &&
                ` (비활성 ${purposes.filter((p) => !p.isActive).length}개)`}
            </Text>
          </View>

          {/* Purpose list */}
          {filteredPurposes.map(renderPurposeItem)}
        </ScrollView>
      )}

      {/* Create purpose modal */}
      {renderPurposeFormModal(
        showCreateModal,
        false,
        () => setShowCreateModal(false),
        handleCreatePurpose
      )}

      {/* Edit purpose modal */}
      {renderPurposeFormModal(
        showEditModal,
        true,
        () => setShowEditModal(false),
        handleUpdatePurpose
      )}
      </View>

      <FloatingActionBar
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
