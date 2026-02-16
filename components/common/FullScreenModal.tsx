import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';
import type { ReactNode } from 'react';

interface RightButton {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface BottomButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

interface FullScreenModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  rightButton?: RightButton;
  bottomButtons?: BottomButton[];
  children: ReactNode;
  scrollable?: boolean;
}

/**
 * FullScreenModal Component
 *
 * A full-screen modal for forms and selections.
 *
 * Layout:
 * - Header: X button (left) + Title (center) + Action button (right)
 * - Content: Scrollable content area
 * - Footer: Optional bottom buttons
 *
 * @example
 * // Create modal
 * <FullScreenModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="새 태그"
 *   rightButton={{ label: "생성", onPress: handleCreate }}
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
 *   rightButton={{ label: "저장", onPress: handleSave, loading: isSaving }}
 * >
 *   <FormContent />
 * </FullScreenModal>
 */
export function FullScreenModal({
  visible,
  onClose,
  title,
  rightButton,
  bottomButtons,
  children,
  scrollable = true,
}: FullScreenModalProps) {
  const closeIconColor = useThemeColor(colors.light.text.primary, colors.dark.text.primary);
  const insets = useSafeAreaInsets();

  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? { className: 'flex-1', contentContainerStyle: { flexGrow: 1 } }
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

          {/* Right Button */}
          {rightButton ? (
            <TouchableOpacity
              onPress={rightButton.onPress}
              disabled={rightButton.disabled || rightButton.loading}
              className="px-3 py-1 min-w-[60px] items-center"
              accessibilityLabel={rightButton.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: rightButton.disabled }}
            >
              {rightButton.loading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text
                  className={`font-semibold ${
                    rightButton.disabled
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {rightButton.label}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>

        {/* Content */}
        <Container {...containerProps}>{children}</Container>

        {/* Bottom Buttons (Optional) */}
        {bottomButtons && bottomButtons.length > 0 && (
          <View
            className="flex-row gap-3 px-4 pt-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {bottomButtons.map((button, index) => (
              <BottomButtonComponent key={index} {...button} />
            ))}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Bottom Button Component
 */
function BottomButtonComponent({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: BottomButton) {
  const getButtonStyle = () => {
    if (disabled) return 'bg-gray-300 dark:bg-gray-700';
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 dark:bg-blue-500';
      case 'secondary':
        return 'bg-gray-200 dark:bg-gray-700';
      case 'danger':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-blue-600 dark:bg-blue-500';
    }
  };

  const getTextStyle = () => {
    if (disabled) return 'text-gray-500 dark:text-gray-400';
    switch (variant) {
      case 'primary':
        return 'text-white';
      case 'secondary':
        return 'text-gray-900 dark:text-gray-100';
      case 'danger':
        return 'text-white';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-1 py-4 rounded-xl items-center justify-center ${getButtonStyle()}`}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' ? '#374151' : '#FFFFFF'} />
      ) : (
        <Text className={`font-semibold text-base ${getTextStyle()}`}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
