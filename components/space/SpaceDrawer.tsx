import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDrawerStore } from '@/store/drawerStore';
import { useSpaceStore } from '@/store/spaceStore';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import type { Space } from '@/types/space';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

function SpaceInitial({ space }: { space: Space }) {
  const initial = space.name.charAt(0).toUpperCase();

  if (space.icon) {
    return (
      <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-100 dark:bg-blue-900">
        <Text className="text-2xl">{space.icon}</Text>
      </View>
    );
  }

  return (
    <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-500">
      <Text className="text-white text-lg font-bold">{initial}</Text>
    </View>
  );
}

function SpaceInitialSmall({ space }: { space: Space }) {
  const initial = space.name.charAt(0).toUpperCase();

  if (space.icon) {
    return (
      <View className="w-9 h-9 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-700">
        <Text className="text-xl">{space.icon}</Text>
      </View>
    );
  }

  return (
    <View className="w-9 h-9 rounded-full items-center justify-center bg-gray-400 dark:bg-gray-600">
      <Text className="text-white text-sm font-bold">{initial}</Text>
    </View>
  );
}

export function SpaceDrawer() {
  const { isOpen, closeDrawer } = useDrawerStore();
  const { currentSpace, spaces, setCurrentSpace } = useSpaceStore();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const iconColor = useThemeColor('#374151', '#D1D5DB');
  const chevronColor = useThemeColor('#9CA3AF', '#6B7280');

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, overlayOpacity, translateX]);

  const handleSelectSpace = async (space: Space) => {
    await setCurrentSpace(space);
    closeDrawer();
  };

  const handleManageSpaces = () => {
    closeDrawer();
    router.push('/(tabs)/settings/spaces' as never);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={closeDrawer}
      statusBarTranslucent
    >
      <View className="flex-1 flex-row">
        {/* Drawer panel */}
        <Animated.View
          style={[
            {
              width: DRAWER_WIDTH,
              transform: [{ translateX }],
            },
          ]}
          className="flex-1 bg-white dark:bg-gray-900 shadow-xl"
        >
          {/* Header: current space */}
          <View className="px-6 pt-12 pb-5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            {currentSpace ? (
              <View className="flex-row items-center gap-3">
                <SpaceInitial space={currentSpace} />
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    현재 공간
                  </Text>
                  <Text className="text-lg font-bold text-gray-900 dark:text-gray-100" numberOfLines={1}>
                    {currentSpace.name}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <Text className="text-base font-semibold text-gray-400 dark:text-gray-500">
                  공간 없음
                </Text>
              </View>
            )}
          </View>

          {/* Space list */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="py-2">
              <Text className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                공간 목록
              </Text>
              {spaces.map((space) => {
                const isSelected = currentSpace?.id === space.id;
                return (
                  <Pressable
                    key={space.id}
                    onPress={() => handleSelectSpace(space)}
                    className={`flex-row items-center px-6 py-3 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                    }`}
                    accessibilityLabel={`${space.name} 공간 선택`}
                    accessibilityRole="button"
                  >
                    <SpaceInitialSmall space={space} />
                    <Text
                      className={`flex-1 ml-3 text-base font-medium ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}
                      numberOfLines={1}
                    >
                      {space.name}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={20} color="#2563EB" />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Divider */}
            <View className="mx-6 border-b border-gray-200 dark:border-gray-700 my-1" />

            {/* Space management button */}
            <Pressable
              onPress={handleManageSpaces}
              className="flex-row items-center px-6 py-4"
              accessibilityLabel="공간 관리"
              accessibilityRole="button"
            >
              <View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center">
                <Ionicons name="settings-outline" size={18} color={iconColor} />
              </View>
              <Text className="ml-3 text-base font-medium text-gray-700 dark:text-gray-300">
                공간 관리
              </Text>
              <Ionicons name="chevron-forward" size={16} color={chevronColor} style={{ marginLeft: 'auto' }} />
            </Pressable>
          </ScrollView>
        </Animated.View>

        {/* Overlay (right 20%) */}
        <Animated.View
          style={{ flex: 1, opacity: overlayOpacity }}
          className="bg-black/50"
        >
          <Pressable className="flex-1" onPress={closeDrawer} accessibilityLabel="드로어 닫기" />
        </Animated.View>
      </View>
    </Modal>
  );
}
