import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';

interface BottomSheetOption {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: BottomSheetOption[];
}

/**
 * 공통 BottomSheet 컴포넌트
 *
 * @param visible - 바텀시트 표시 여부
 * @param onClose - 닫기 콜백
 * @param title - 상단 타이틀 (선택)
 * @param options - 옵션 리스트
 *
 * @example
 * <BottomSheet
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="사진 등록"
 *   options={[
 *     { label: '사진 찍기', icon: 'camera', onPress: handleCamera },
 *     { label: '갤러리에서 선택', icon: 'images', onPress: handleGallery },
 *   ]}
 * />
 */
export function BottomSheet({ visible, onClose, title, options }: BottomSheetProps) {
  const iconColor = useThemeColor(colors.light.text.primary, colors.dark.text.primary);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable
        className="flex-1 bg-black/50"
        onPress={onClose}
      >
        {/* Bottom Sheet */}
        <Pressable
          className="absolute bottom-0 left-0 right-0"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="bg-white dark:bg-gray-800 rounded-t-3xl">
            {/* Title */}
            {title && (
              <View className="px-6 pt-6 pb-2">
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                  {title}
                </Text>
              </View>
            )}

            {/* Options */}
            <View className="px-4 py-2">
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    option.onPress();
                    onClose();
                  }}
                  className="flex-row items-center px-4 py-4 rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
                >
                  {option.icon && (
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={option.destructive ? colors.error : iconColor}
                      style={{ marginRight: 12 }}
                    />
                  )}
                  <Text
                    className={`text-base font-medium ${
                      option.destructive
                        ? 'text-red-500'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel Button */}
            <View className="px-4 pb-6 pt-2">
              <TouchableOpacity
                onPress={onClose}
                className="py-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                <Text className="text-center text-base font-semibold text-gray-900 dark:text-gray-100">
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
