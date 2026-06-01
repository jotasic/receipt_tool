import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';
import { useDrawerStore } from '@/store/drawerStore';
import { useSpaceStore } from '@/store/spaceStore';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: ReactNode;
  showSpaceIcon?: boolean;
}

function SpaceBadge() {
  const { currentSpace } = useSpaceStore();
  const { openDrawer } = useDrawerStore();

  const initial = currentSpace ? currentSpace.name.charAt(0).toUpperCase() : '?';

  return (
    <Pressable
      onPress={openDrawer}
      className="mr-3"
      accessibilityLabel="공간 선택 열기"
      accessibilityRole="button"
    >
      {currentSpace?.icon ? (
        <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center">
          <Text className="text-lg">{currentSpace.icon}</Text>
        </View>
      ) : (
        <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center">
          <Text className="text-white text-xs font-bold">{initial}</Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * 공통 Header 컴포넌트
 *
 * @param title - 헤더 타이틀
 * @param showBack - 뒤로가기 버튼 표시 여부 (2depth 화면용)
 * @param rightElement - 오른쪽 영역에 표시할 요소 (선택)
 * @param showSpaceIcon - 왼쪽에 공간 아이콘/이니셜 버튼 표시 여부 (기본값: false)
 *
 * @example
 * // 1depth (탭 화면)
 * <Header title="증빙 관리" />
 *
 * // 1depth + 공간 아이콘
 * <Header title="대시보드" showSpaceIcon />
 *
 * // 2depth (상세/편집 화면)
 * <Header title="리포트 생성" showBack />
 *
 * // 오른쪽 버튼 포함
 * <Header title="리포트" rightElement={<AddButton />} />
 */
export function Header({ title, showBack = false, rightElement, showSpaceIcon = false }: HeaderProps) {
  const iconColor = useThemeColor(colors.light.text.primary, colors.dark.text.primary);

  return (
    <View className="flex-row items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* 공간 아이콘 버튼 (1depth 탭 화면용) */}
      {showSpaceIcon && !showBack && <SpaceBadge />}

      {/* 뒤로가기 버튼 (2depth) */}
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="뒤로 가기"
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
      )}

      {/* 타이틀 */}
      <Text className="flex-1 text-xl font-bold text-gray-900 dark:text-gray-100">
        {title}
      </Text>

      {/* 오른쪽 요소 */}
      {rightElement && (
        <View className="ml-3">
          {rightElement}
        </View>
      )}
    </View>
  );
}
