import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header, SegmentedControl, FullScreenModal, FloatingActionBar } from '@/components/common';
import { TabScreenContent } from '@/design-system/layouts';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { getAllSpaces } from '@/services/database/spaceService';
import {
  getClassificationsBySpace,
  createClassification,
  updateClassification,
  deleteClassification,
  isClassificationInUse,
} from '@/services/database/classificationService';
import type { Space, Classification } from '@/types/space';

interface EditModal {
  visible: boolean;
  mode: 'add' | 'edit';
  classification?: Classification;
  text: string;
}

export default function ClassificationsScreen() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editModal, setEditModal] = useState<EditModal>({
    visible: false,
    mode: 'add',
    text: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const placeholderColor = useThemeColor('#9CA3AF', '#6B7280');

  useFocusEffect(
    useCallback(() => {
      loadSpaces();
    }, [])
  );

  // 공간 선택 변경 시 분류 재로드
  useEffect(() => {
    if (spaces.length > 0) {
      const space = spaces[selectedSpaceIndex];
      if (space) {
        loadClassifications(space.id);
      }
    }
  }, [selectedSpaceIndex, spaces]);

  const loadSpaces = async () => {
    setIsLoading(true);
    try {
      const list = await getAllSpaces();
      setSpaces(list);
      if (list.length > 0) {
        const idx = selectedSpaceIndex < list.length ? selectedSpaceIndex : 0;
        await loadClassifications(list[idx].id);
      }
    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassifications = async (spaceId: string) => {
    try {
      const list = await getClassificationsBySpace(spaceId);
      setClassifications(list);
    } catch (error) {
      console.error('Failed to load classifications:', error);
    }
  };

  const currentSpace = spaces[selectedSpaceIndex] ?? null;

  const handleAddClassification = () => {
    if (!currentSpace) {
      Alert.alert('알림', '먼저 공간을 생성해주세요.');
      return;
    }
    setEditModal({ visible: true, mode: 'add', text: '' });
  };

  const handleEditClassification = (classification: Classification) => {
    setEditModal({ visible: true, mode: 'edit', classification, text: classification.name });
  };

  const handleModalConfirm = async () => {
    const name = editModal.text.trim();
    if (!name || !currentSpace) return;

    setIsSaving(true);
    try {
      if (editModal.mode === 'add') {
        await createClassification({ spaceId: currentSpace.id, name });
        await loadClassifications(currentSpace.id);
        setEditModal({ visible: false, mode: 'add', text: '' });
        Alert.alert('성공', '분류가 추가되었습니다.');
      } else if (editModal.mode === 'edit' && editModal.classification) {
        await updateClassification(editModal.classification.id, { name });
        await loadClassifications(currentSpace.id);
        setEditModal({ visible: false, mode: 'add', text: '' });
        Alert.alert('성공', '분류 이름이 수정되었습니다.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      const action = editModal.mode === 'add' ? '추가' : '수정';
      Alert.alert('오류', `분류 ${action}에 실패했습니다.\n${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalCancel = () => {
    setEditModal({ visible: false, mode: 'add', text: '' });
  };

  const handleToggleActive = async (classification: Classification) => {
    try {
      await updateClassification(classification.id, {
        isActive: !classification.isActive,
      });
      if (currentSpace) {
        await loadClassifications(currentSpace.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      Alert.alert('오류', `상태 변경에 실패했습니다.\n${message}`);
    }
  };

  const handleDeleteClassification = async (classification: Classification) => {
    try {
      const inUse = await isClassificationInUse(classification.id);
      if (inUse) {
        Alert.alert(
          '삭제 불가',
          '이 분류를 사용하는 항목이 있습니다.\n항목을 먼저 삭제하거나 재분류해주세요.'
        );
        return;
      }

      Alert.alert(
        '분류 삭제',
        `'${classification.name}' 분류를 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteClassification(classification.id);
                if (currentSpace) {
                  await loadClassifications(currentSpace.id);
                }
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : '알 수 없는 오류';
                Alert.alert('오류', `분류 삭제에 실패했습니다.\n${message}`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to check classification usage:', error);
    }
  };

  const modalTitle = editModal.mode === 'add' ? '분류 추가' : '분류 수정';
  const modalPlaceholder =
    editModal.mode === 'add' ? '새 분류 이름을 입력해주세요' : '분류 이름을 수정해주세요';

  return (
    <>
      <Header title="분류 관리" showBack />
      <TabScreenContent>
        {isLoading ? (
          <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : spaces.length === 0 ? (
          <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-6">
            <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
              <Ionicons name="grid-outline" size={48} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-2 text-center">
              등록된 공간이 없습니다
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-base text-center">
              먼저 설정 {'>'} 공간 관리에서{'\n'}공간을 추가해주세요
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* 공간 탭 */}
            <View className="px-4 pt-4 pb-2">
              <SegmentedControl
                values={spaces.map((s) => s.name)}
                selectedIndex={selectedSpaceIndex}
                onChange={setSelectedSpaceIndex}
              />
            </View>

            {/* 분류 목록 */}
            <View className="px-4 pt-2 pb-28">
              {classifications.length === 0 ? (
                <View className="items-center py-12">
                  <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
                    <Ionicons name="grid-outline" size={48} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-2">
                    등록된 분류가 없습니다
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-base text-center">
                    하단 + 버튼으로{'\n'}첫 분류를 추가해보세요
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {classifications.map((classification) => {
                    const color = classification.color ?? '#6B7280';
                    const iconName = classification.icon ?? 'folder-outline';

                    return (
                      <View
                        key={classification.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <View className="flex-row items-center">
                          {/* 아이콘 + 이름 */}
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            {/^[a-z0-9-]+$/.test(iconName) ? (
                              <Ionicons
                                name={iconName as React.ComponentProps<typeof Ionicons>['name']}
                                size={20}
                                color={color}
                              />
                            ) : (
                              <Text style={{ fontSize: 18 }}>{iconName}</Text>
                            )}
                          </View>
                          <View className="flex-1 mr-3">
                            <Text
                              className={`text-base font-semibold ${
                                classification.isActive
                                  ? 'text-gray-900 dark:text-gray-100'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}
                            >
                              {classification.name}
                            </Text>
                            {!classification.isActive && (
                              <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                비활성
                              </Text>
                            )}
                          </View>

                          {/* 액션 버튼들 */}
                          <View className="flex-row items-center gap-2">
                            <Pressable
                              onPress={() => handleToggleActive(classification)}
                              className={`px-2.5 py-1.5 rounded-lg ${
                                classification.isActive
                                  ? 'bg-gray-100 dark:bg-gray-700'
                                  : 'bg-blue-50 dark:bg-blue-900/30'
                              }`}
                              accessibilityLabel={
                                classification.isActive
                                  ? `${classification.name} 비활성화`
                                  : `${classification.name} 활성화`
                              }
                              accessibilityRole="button"
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  classification.isActive
                                    ? 'text-gray-600 dark:text-gray-300'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {classification.isActive ? '비활성' : '활성'}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleEditClassification(classification)}
                              className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"
                              accessibilityLabel={`${classification.name} 수정`}
                              accessibilityRole="button"
                            >
                              <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                수정
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteClassification(classification)}
                              className="px-2.5 py-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg"
                              accessibilityLabel={`${classification.name} 삭제`}
                              accessibilityRole="button"
                            >
                              <Text className="text-xs font-medium text-red-600 dark:text-red-400">
                                삭제
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </TabScreenContent>

      {/* 분류 추가/수정 모달 */}
      <FullScreenModal
        visible={editModal.visible}
        onClose={handleModalCancel}
        title={modalTitle}
        rightButton={{
          icon: 'checkmark',
          onPress: handleModalConfirm,
          disabled: !editModal.text.trim(),
          loading: isSaving,
        }}
      >
        <View className="p-4">
          {currentSpace ? (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              공간: {currentSpace.name}
            </Text>
          ) : null}
          <TextInput
            value={editModal.text}
            onChangeText={(text) =>
              setEditModal((prev) => ({ ...prev, text }))
            }
            placeholder={modalPlaceholder}
            placeholderTextColor={placeholderColor}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleModalConfirm}
            className="rounded-xl px-4 py-3 text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          />
        </View>
      </FullScreenModal>

      <FloatingActionBar
        actions={[
          {
            icon: 'add',
            onPress: handleAddClassification,
            variant: 'primary',
          },
        ]}
      />
    </>
  );
}
