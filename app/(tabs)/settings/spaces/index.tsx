import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/common';
import { TabScreenContent } from '@/design-system/layouts';
import { useSpaceStore } from '@/store/spaceStore';
import {
  getAllSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  isSpaceInUse,
} from '@/services/database/spaceService';
import type { Space } from '@/types/space';

export default function SpacesScreen() {
  const { refreshSpaces } = useSpaceStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSpaces();
    }, [])
  );

  const loadSpaces = async () => {
    setIsLoading(true);
    try {
      const list = await getAllSpaces();
      setSpaces(list);
    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSpace = () => {
    Alert.prompt(
      '공간 추가',
      '새 공간 이름을 입력해주세요',
      async (name) => {
        if (!name || !name.trim()) return;
        try {
          await createSpace({ name: name.trim() });
          await loadSpaces();
          await refreshSpaces();
          Alert.alert('성공', '공간이 추가되었습니다.');
        } catch (error) {
          const message =
            error instanceof Error ? error.message : '알 수 없는 오류';
          Alert.alert('오류', `공간 추가에 실패했습니다.\n${message}`);
        }
      },
      'plain-text',
      '',
      'default'
    );
  };

  const handleEditSpace = (space: Space) => {
    Alert.prompt(
      '공간 수정',
      '새 이름을 입력해주세요',
      async (name) => {
        if (!name || !name.trim()) return;
        try {
          await updateSpace(space.id, { name: name.trim() });
          await loadSpaces();
          await refreshSpaces();
          Alert.alert('성공', '공간 이름이 수정되었습니다.');
        } catch (error) {
          const message =
            error instanceof Error ? error.message : '알 수 없는 오류';
          Alert.alert('오류', `공간 수정에 실패했습니다.\n${message}`);
        }
      },
      'plain-text',
      space.name,
      'default'
    );
  };

  const handleDeleteSpace = async (space: Space) => {
    try {
      const inUse = await isSpaceInUse(space.id);
      if (inUse) {
        Alert.alert(
          '삭제 불가',
          '이 공간에 등록된 항목이 있습니다.\n항목을 먼저 삭제하거나 이동해주세요.'
        );
        return;
      }

      Alert.alert(
        '공간 삭제',
        `'${space.name}' 공간을 삭제하시겠습니까?\n이 공간의 분류도 함께 삭제됩니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteSpace(space.id);
                await loadSpaces();
                await refreshSpaces();
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : '알 수 없는 오류';
                Alert.alert('오류', `공간 삭제에 실패했습니다.\n${message}`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to check space usage:', error);
    }
  };

  return (
    <>
      <Header
        title="공간 관리"
        showBack
        rightElement={
          <Pressable
            onPress={handleAddSpace}
            className="p-2"
            accessibilityLabel="공간 추가"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={24} color="#3B82F6" />
          </Pressable>
        }
      />
      <TabScreenContent>
        {isLoading ? (
          <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <View className="px-4 pt-4 pb-8">
              {spaces.length === 0 ? (
                <View className="items-center py-16">
                  <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
                    <Ionicons name="layers-outline" size={48} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-2">
                    등록된 공간이 없습니다
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-base text-center mb-6">
                    우측 상단 + 버튼으로{'\n'}첫 공간을 추가해보세요
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {spaces.map((space) => (
                    <View
                      key={space.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 mr-3">
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{
                              backgroundColor: space.color
                                ? `${space.color}20`
                                : '#E5E7EB',
                            }}
                          >
                            {space.icon ? (
                              <Text className="text-xl">{space.icon}</Text>
                            ) : (
                              <Ionicons
                                name="layers-outline"
                                size={20}
                                color={space.color ?? '#6B7280'}
                              />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                              {space.name}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => handleEditSpace(space)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"
                            accessibilityLabel={`${space.name} 수정`}
                            accessibilityRole="button"
                          >
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              수정
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteSpace(space)}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg"
                            accessibilityLabel={`${space.name} 삭제`}
                            accessibilityRole="button"
                          >
                            <Text className="text-sm font-medium text-red-600 dark:text-red-400">
                              삭제
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </TabScreenContent>
    </>
  );
}
