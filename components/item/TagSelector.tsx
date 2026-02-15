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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '@/components/common';
import { getTags, createTag } from '@/services/database/tagService';
import type { Tag } from '@/types/tag';

interface TagSelectorProps {
  /** Currently selected tags */
  selectedTags: Tag[];
  /** Callback when tags change */
  onTagsChange: (tags: Tag[]) => void;
  /** Optional label */
  label?: string;
}

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

export function TagSelector({
  selectedTags,
  onTagsChange,
  label = '태그',
}: TagSelectorProps) {
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
        <Text className="text-gray-700 text-base font-medium mb-2">
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
          className="px-3 py-1.5 rounded-full border-2 border-dashed border-gray-300 flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1">태그 추가</Text>
        </TouchableOpacity>
      </View>

      {/* Tag selection modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
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
              <View className="p-4 border-b border-gray-200">
                <Text className="text-base font-semibold text-gray-900 mb-3">
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
                <Text className="text-gray-700 text-base font-medium mb-2">
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
                        borderColor: '#111827',
                      }}
                      activeOpacity={0.7}
                    >
                      {newTagColor === color && (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
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
              <View className="p-4 border-b border-gray-200">
                <Button
                  title="새 태그 만들기"
                  onPress={() => setIsCreatingTag(true)}
                  variant="outline"
                  icon={<Ionicons name="add" size={18} color="#2563EB" />}
                />
              </View>
            )}

            {/* Search bar */}
            <View className="px-4 py-3 border-b border-gray-200">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#6B7280" />
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
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-2 text-gray-600">로딩 중...</Text>
              </View>
            ) : availableTags.length === 0 ? (
              <View className="flex-1 items-center justify-center p-6">
                <Ionicons name="pricetags-outline" size={48} color="#D1D5DB" />
                <Text className="mt-3 text-gray-500 text-center">
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
                      className="flex-row items-center py-3 border-b border-gray-100"
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
                      <Text className="flex-1 text-base text-gray-900">
                        {tag.name}
                      </Text>
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="#3B82F6"
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
