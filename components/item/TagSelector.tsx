/**
 * TagSelector - Reusable tag selection component
 *
 * Features:
 * - Display selected tags as colored chips/badges
 * - Add new tag with inline creation modal
 * - Select from existing tags
 * - Color picker for new tags
 * - Remove tag functionality
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/common';
import { getTags, createTag } from '@/services/database/tagService';
import type { Tag } from '@/types/tag';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';

interface TagSelectorProps {
  /** Currently selected tags */
  selectedTags: Tag[];
  /** Callback when tags change */
  onTagsChange: (tags: Tag[]) => void;
  /** Optional label */
  label?: string;
}

// Predefined color palette (using design tokens)
const TAG_COLORS = [
  colors.error, // red
  colors.warning, // amber
  colors.success, // green
  colors.primary, // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  colors.secondary, // gray
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
];

export function TagSelector({
  selectedTags,
  onTagsChange,
  label = '태그',
}: TagSelectorProps) {
  const colorScheme = useColorScheme();
  const addIconColor = useThemeColor(colors.light.text.secondary, colors.dark.text.muted);
  const closeIconColor = useThemeColor(colors.light.text.primary, colors.dark.text.primary);
  const borderColorForCheckmark = useThemeColor(colors.light.text.primary, colors.dark.text.primary);
  const emptyStateIconColor = useThemeColor(colors.light.text.muted, colors.dark.text.secondary);

  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all tags when modal opens
  useEffect(() => {
    if (showModal) {
      loadTags();
    }
  }, [showModal]);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const tags = await getTags();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
      Alert.alert('오류', '태그를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add tag to selection
  const handleAddTag = (tag: Tag) => {
    // Check if already selected
    if (selectedTags.some((t) => t.id === tag.id)) {
      return;
    }
    onTagsChange([...selectedTags, tag]);
  };

  // Remove tag from selection
  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('오류', '태그 이름을 입력해주세요.');
      return;
    }

    // Check if tag already exists
    const existingTag = allTags.find(
      (t) => t.name.toLowerCase() === newTagName.trim().toLowerCase()
    );

    if (existingTag) {
      Alert.alert('오류', '이미 존재하는 태그입니다.');
      return;
    }

    setIsLoading(true);
    try {
      const newTag = await createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });

      // Add to all tags
      setAllTags([...allTags, newTag]);

      // Add to selection
      handleAddTag(newTag);

      // Reset form
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
      setIsCreatingTag(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      Alert.alert('오류', '태그를 생성할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tags by search query
  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter out already selected tags
  const availableTags = filteredTags.filter(
    (tag) => !selectedTags.some((t) => t.id === tag.id)
  );

  return (
    <View className="mb-4">
      {/* Label */}
      {label && (
        <Text className="text-gray-700 dark:text-gray-200 text-base font-medium mb-2">
          {label}
        </Text>
      )}

      {/* Selected tags display */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            onPress={() => handleRemoveTag(tag.id)}
            className="px-3 py-1.5 rounded-full flex-row items-center"
            style={{ backgroundColor: tag.color + '20' }}
            activeOpacity={0.7}
          >
            <Text
              className="text-sm font-medium mr-1"
              style={{ color: tag.color }}
            >
              {tag.name}
            </Text>
            <Ionicons name="close-circle" size={16} color={tag.color} />
          </TouchableOpacity>
        ))}

        {/* Add tag button */}
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="px-3 py-1.5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color={addIconColor} />
          <Text className="text-sm text-gray-600 dark:text-gray-300 ml-1">태그 추가</Text>
        </TouchableOpacity>
      </View>

      {/* Tag selection modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-white dark:bg-gray-900">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="close" size={24} color={closeIconColor} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              태그 선택
            </Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="px-3 py-1"
            >
              <Text className="text-blue-600 font-medium">완료</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1">
            {/* Create new tag section */}
            {isCreatingTag ? (
              <View className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  새 태그 만들기
                </Text>

                <Input
                  label="태그 이름"
                  placeholder="태그 이름을 입력하세요"
                  value={newTagName}
                  onChangeText={setNewTagName}
                  autoCapitalize="none"
                />

                {/* Color picker */}
                <Text className="text-gray-700 dark:text-gray-200 text-base font-medium mb-2">
                  색상
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {TAG_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setNewTagColor(color)}
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: color,
                        borderWidth: newTagColor === color ? 3 : 0,
                        borderColor: borderColorForCheckmark,
                      }}
                      activeOpacity={0.7}
                    >
                      {newTagColor === color && (
                        <Ionicons name="checkmark" size={20} color={colors.light.surface} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Action buttons */}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      title="취소"
                      onPress={() => {
                        setIsCreatingTag(false);
                        setNewTagName('');
                        setNewTagColor(TAG_COLORS[0]);
                      }}
                      variant="outline"
                      disabled={isLoading}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title={isLoading ? '생성 중...' : '생성'}
                      onPress={handleCreateTag}
                      variant="primary"
                      disabled={isLoading}
                      loading={isLoading}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Button
                  title="새 태그 만들기"
                  onPress={() => setIsCreatingTag(true)}
                  variant="outline"
                  icon={<Ionicons name="add" size={18} color={colors.primary} />}
                />
              </View>
            )}

            {/* Search bar */}
            <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color={colors.secondary} />
                <Input
                  placeholder="태그 검색"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Tags list */}
            {isLoading && !isCreatingTag ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-2 text-gray-600 dark:text-gray-300">로딩 중...</Text>
              </View>
            ) : availableTags.length === 0 ? (
              <View className="flex-1 items-center justify-center p-6">
                <Ionicons name="pricetags-outline" size={48} color={emptyStateIconColor} />
                <Text className="mt-3 text-gray-500 dark:text-gray-300 text-center">
                  {searchQuery
                    ? '검색 결과가 없습니다'
                    : '사용 가능한 태그가 없습니다\n새 태그를 만들어보세요'}
                </Text>
              </View>
            ) : (
              <ScrollView className="flex-1">
                <View className="p-4">
                  {availableTags.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => handleAddTag(tag)}
                      className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-700"
                      activeOpacity={0.7}
                    >
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: tag.color + '20' }}
                      >
                        <Ionicons
                          name="pricetag"
                          size={16}
                          color={tag.color}
                        />
                      </View>
                      <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">
                        {tag.name}
                      </Text>
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
