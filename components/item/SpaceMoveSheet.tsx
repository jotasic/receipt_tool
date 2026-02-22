import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import type { Space } from '@/types/space';

interface SpaceMoveSheetProps {
  visible: boolean;
  onClose: () => void;
  onMove: (targetSpace: Space) => void;
  currentSpaceId?: string;
  spaces: Space[];
  isMoving?: boolean;
}

export function SpaceMoveSheet({
  visible,
  onClose,
  onMove,
  currentSpaceId,
  spaces,
  isMoving = false,
}: SpaceMoveSheetProps) {
  const insets = useSafeAreaInsets();
  const iconColor = useThemeColor('#374151', '#D1D5DB');
  const chevronColor = useThemeColor('#9CA3AF', '#6B7280');
  const noticeIconColor = useThemeColor('#D97706', '#FCD34D');

  const otherSpaces = spaces.filter((space) => space.id !== currentSpaceId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        {/* Bottom Sheet */}
        <Pressable
          className="absolute bottom-0 left-0 right-0"
          onPress={(e) => e.stopPropagation()}
        >
          <View
            className="bg-white dark:bg-gray-800 rounded-t-3xl"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {/* Handle bar */}
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                워크스페이스 이동
              </Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center"
                accessibilityLabel="닫기"
                accessibilityRole="button"
                disabled={isMoving}
              >
                <Ionicons name="close" size={22} color={iconColor} />
              </Pressable>
            </View>

            {/* Notice */}
            <View className="flex-row items-center px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30">
              <Ionicons name="information-circle-outline" size={16} color={noticeIconColor} />
              <Text className="ml-2 text-sm text-amber-700 dark:text-amber-300">
                이동 시 현재 분류가 초기화됩니다.
              </Text>
            </View>

            {/* Space List */}
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-72">
              {otherSpaces.length === 0 ? (
                <View className="px-6 py-10 items-center">
                  <Text className="text-base text-gray-500 dark:text-gray-400">
                    이동 가능한 워크스페이스가 없습니다.
                  </Text>
                </View>
              ) : (
                otherSpaces.map((space) => (
                  <Pressable
                    key={space.id}
                    onPress={() => onMove(space)}
                    disabled={isMoving}
                    className="flex-row items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700"
                    accessibilityRole="button"
                    accessibilityLabel={`${space.name} 워크스페이스로 이동`}
                  >
                    {/* Space Icon */}
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-gray-100 dark:bg-gray-700">
                      {space.icon ? (
                        <Text className="text-xl">{space.icon}</Text>
                      ) : (
                        <Ionicons name="folder-outline" size={20} color={iconColor} />
                      )}
                    </View>

                    {/* Space Name */}
                    <Text className="flex-1 text-base font-medium text-gray-900 dark:text-gray-100">
                      {space.name}
                    </Text>

                    {/* Arrow or Loading */}
                    {isMoving ? (
                      <ActivityIndicator size="small" color={chevronColor} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={chevronColor} />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
