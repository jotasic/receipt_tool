import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: ReactNode;
}

/**
 * 공통 Header 컴포넌트
 *
 * @param title - 헤더 타이틀
 * @param showBack - 뒤로가기 버튼 표시 여부 (2depth 화면용)
 * @param rightElement - 오른쪽 영역에 표시할 요소 (선택)
 *
 * @example
 * // 1depth (탭 화면)
 * <Header title="증빙 관리" />
 *
 * // 2depth (상세/편집 화면)
 * <Header title="리포트 생성" showBack />
 *
 * // 오른쪽 버튼 포함
 * <Header title="리포트" rightElement={<AddButton />} />
 */
export function Header({ title, showBack = false, rightElement }: HeaderProps) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#F9FAFB' : '#111827';

  return (
    <View className="flex-row items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
