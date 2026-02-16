/**
 * Tag Management Screen
 *
 * Features:
 * - List all tags with their colors
 * - Create new tag
 * - Edit tag (name and color)
 * - Delete tag (with confirmation and usage check)
 * - Show tag usage count
 * - Search tags
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Input, Button, FullScreenModal } from '@/components/common';
import { ScreenLayout } from '@/design-system/layouts';
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getItemsByTag,
} from '@/services/database/tagService';
import type { Tag } from '@/types/tag';

// Predefined color palette
const TAG_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
];

export default function TagManagementScreen() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [tagUsageCounts, setTagUsageCounts] = useState<Record<string, number>>(
    {}
  );

  // Load tags when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [])
  );

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const loadedTags = await getTags();
      setTags(loadedTags);

      // Load usage counts for each tag
      const counts: Record<string, number> = {};
      for (const tag of loadedTags) {
        const items = await getItemsByTag(tag.id);
        counts[tag.id] = items.length;
      }
      setTagUsageCounts(counts);
    } catch (error) {
      console.error('Failed to load tags:', error);
      Alert.alert('오류', '태그를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tags by search query
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open create modal
  const handleOpenCreateModal = () => {
    setTagName('');
    setTagColor(TAG_COLORS[0]);
    setShowCreateModal(true);
  };

  // Open edit modal
  const handleOpenEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setShowEditModal(true);
  };

  // Create new tag
  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      Alert.alert('오류', '태그 이름을 입력해주세요.');
      return;
    }

    // Check if tag already exists
    const existingTag = tags.find(
      (t) => t.name.toLowerCase() === tagName.trim().toLowerCase()
    );

    if (existingTag) {
      Alert.alert('오류', '이미 존재하는 태그입니다.');
      return;
    }

    setIsSaving(true);
    try {
      const newTag = await createTag({
        name: tagName.trim(),
        color: tagColor,
      });

      setTags([...tags, newTag]);
      setTagUsageCounts({ ...tagUsageCounts, [newTag.id]: 0 });
      setShowCreateModal(false);
      Alert.alert('성공', '태그가 생성되었습니다.');
    } catch (error) {
      console.error('Failed to create tag:', error);
      Alert.alert('오류', '태그를 생성할 수 없습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update tag
  const handleUpdateTag = async () => {
    if (!editingTag) return;

    if (!tagName.trim()) {
      Alert.alert('오류', '태그 이름을 입력해주세요.');
      return;
    }

    // Check if tag name already exists (excluding current tag)
    const existingTag = tags.find(
      (t) =>
        t.id !== editingTag.id &&
        t.name.toLowerCase() === tagName.trim().toLowerCase()
    );

    if (existingTag) {
      Alert.alert('오류', '이미 존재하는 태그입니다.');
      return;
    }

    setIsSaving(true);
    try {
      await updateTag(editingTag.id, {
        name: tagName.trim(),
        color: tagColor,
      });

      // Update in local state
      setTags(
        tags.map((t) =>
          t.id === editingTag.id
            ? { ...t, name: tagName.trim(), color: tagColor }
            : t
        )
      );

      setShowEditModal(false);
      Alert.alert('성공', '태그가 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update tag:', error);
      Alert.alert('오류', '태그를 수정할 수 없습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete tag
  const handleDeleteTag = (tag: Tag) => {
    const usageCount = tagUsageCounts[tag.id] || 0;

    Alert.alert(
      '태그 삭제',
      usageCount > 0
        ? `이 태그는 ${usageCount}개의 항목에서 사용 중입니다.\n삭제하시겠습니까?`
        : '이 태그를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => confirmDeleteTag(tag),
        },
      ]
    );
  };

  const confirmDeleteTag = async (tag: Tag) => {
    setIsLoading(true);
    try {
      await deleteTag(tag.id);
      setTags(tags.filter((t) => t.id !== tag.id));
      const newCounts = { ...tagUsageCounts };
      delete newCounts[tag.id];
      setTagUsageCounts(newCounts);
      Alert.alert('성공', '태그가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete tag:', error);
      Alert.alert('오류', '태그를 삭제할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render tag item
  const renderTagItem = (tag: Tag) => {
    const usageCount = tagUsageCounts[tag.id] || 0;

    return (
      <View
        key={tag.id}
        className="flex-row items-center py-3 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      >
        {/* Color indicator */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: tag.color + '20' }}
        >
          <Ionicons name="pricetag" size={20} color={tag.color} />
        </View>

        {/* Tag info */}
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
            {tag.name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {usageCount}개 항목에서 사용 중
          </Text>
        </View>

        {/* Edit button */}
        <TouchableOpacity
          onPress={() => handleOpenEditModal(tag)}
          className="w-9 h-9 items-center justify-center mr-2"
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={22} color="#3B82F6" />
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          onPress={() => handleDeleteTag(tag)}
          className="w-9 h-9 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render tag form modal
  const renderTagFormModal = (
    visible: boolean,
    isEdit: boolean,
    onClose: () => void,
    onSave: () => void
  ) => (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      title={isEdit ? '태그 수정' : '새 태그'}
      rightButton={{
        label: isEdit ? '수정' : '생성',
        onPress: onSave,
        loading: isSaving,
        disabled: isSaving,
      }}
    >
      <View className="p-4">
        <Input
          label="태그 이름"
          placeholder="태그 이름을 입력하세요"
          value={tagName}
          onChangeText={setTagName}
          autoCapitalize="none"
        />

        {/* Color picker */}
        <Text className="text-gray-700 dark:text-gray-300 text-base font-medium mb-2">
          색상
        </Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {TAG_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setTagColor(color)}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: color,
                borderWidth: tagColor === color ? 3 : 0,
                borderColor: '#111827',
              }}
              activeOpacity={0.7}
            >
              {tagColor === color && (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <Text className="text-gray-700 dark:text-gray-300 text-base font-medium mb-2">
          미리보기
        </Text>
        <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <View
            className="px-4 py-2 rounded-full self-start"
            style={{ backgroundColor: tagColor + '20' }}
          >
            <Text
              className="text-base font-medium"
              style={{ color: tagColor }}
            >
              {tagName || '태그 이름'}
            </Text>
          </View>
        </View>
      </View>
    </FullScreenModal>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout
        title="태그 관리"
        showHeader
        showBack
        scrollable={false}
        rightElement={
          <TouchableOpacity
            onPress={handleOpenCreateModal}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="add" size={28} color="#3B82F6" />
          </TouchableOpacity>
        }
      >
        {/* Search bar */}
        <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900 dark:text-gray-100"
            placeholder="태그 검색"
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

      {/* Tags list */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">로딩 중...</Text>
        </View>
      ) : filteredTags.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="pricetags-outline" size={64} color="#D1D5DB" />
          <Text className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {searchQuery ? '검색 결과가 없습니다' : '태그가 없습니다'}
          </Text>
          <Text className="mt-2 text-gray-500 dark:text-gray-400 text-center">
            {searchQuery
              ? '다른 검색어를 입력해보세요'
              : '새 태그를 만들어 항목을 체계적으로 정리하세요'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              onPress={handleOpenCreateModal}
              className="mt-6 px-6 py-3 bg-blue-600 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold">
                새 태그 만들기
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView className="flex-1">
          {/* Tag count */}
          <View className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              총 {filteredTags.length}개의 태그
            </Text>
          </View>

          {/* Tag list */}
          {filteredTags.map(renderTagItem)}
        </ScrollView>
      )}

      {/* Create tag modal */}
      {renderTagFormModal(
        showCreateModal,
        false,
        () => setShowCreateModal(false),
        handleCreateTag
      )}

      {/* Edit tag modal */}
      {renderTagFormModal(
        showEditModal,
        true,
        () => setShowEditModal(false),
        handleUpdateTag
      )}
      </ScreenLayout>
    </>
  );
}
