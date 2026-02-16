import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';
import type { ReactNode } from 'react';

export interface RightButton {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface FullScreenModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  rightButton?: RightButton;
  children: ReactNode;
  scrollable?: boolean;
}

/**
 * FullScreenModal Component
 *
 * A full-screen modal for forms and selections.
 *
 * Layout:
 * - Header: X button (left) + Title (center) + Icon button (right)
 * - Content: Scrollable content area
 *
 * @example
 * // Create modal
 * <FullScreenModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="새 태그"
 *   rightButton={{ icon: "checkmark", onPress: handleCreate }}
 * >
 *   <FormContent />
 * </FullScreenModal>
 *
 * @example
 * // Edit modal
 * <FullScreenModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="태그 수정"
 *   rightButton={{ icon: "checkmark", onPress: handleSave, loading: isSaving }}
 * >
 *   <FormContent />
 * </FullScreenModal>
 */
export function FullScreenModal({
  visible,
  onClose,
  title,
  rightButton,
  children,
  scrollable = true,
}: FullScreenModalProps) {
  const insets = useSafeAreaInsets();
  const closeIconColor = useThemeColor(colors.light.text.primary, colors.dark.text.primary);
  const rightIconColor = useThemeColor('#3B82F6', '#60A5FA');

  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? {
        className: 'flex-1',
        contentContainerStyle: {
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom, 16) + 32  // 소프트키 여유 공간
        }
      }
    : { className: 'flex-1' };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {/* Close Button (Left) */}
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 items-center justify-center"
            disabled={rightButton?.loading}
            accessibilityLabel="닫기"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={closeIconColor} />
          </TouchableOpacity>

          {/* Title (Center) */}
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </Text>

          {/* Right Button (Icon) */}
          {rightButton ? (
            <TouchableOpacity
              onPress={rightButton.onPress}
              disabled={rightButton.disabled || rightButton.loading}
              className="w-10 h-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityState={{ disabled: rightButton.disabled }}
            >
              {rightButton.loading ? (
                <ActivityIndicator size="small" color={rightIconColor} />
              ) : (
                <Ionicons
                  name={rightButton.icon}
                  size={24}
                  color={rightButton.disabled ? '#9CA3AF' : rightIconColor}
                />
              )}
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>

        {/* Content */}
        <Container {...containerProps}>{children}</Container>
      </SafeAreaView>
    </Modal>
  );
}
