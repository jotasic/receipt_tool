import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Appearance } from 'react-native';
import { Header } from '@/components/common';
import { TabScreenContent } from '@/design-system/layouts';
import { useSettingsStore } from '@/store/settingsStore';
import { useItemStore } from '@/store/itemStore';
import { getDatabase } from '@/services/database';
import { DEFAULT_USAGE_PURPOSES } from '@/services/database/schema';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  hasArrow?: boolean;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  textColor?: 'default' | 'red';
  onPress?: () => void;
  disabled?: boolean;
}

function SettingItem({
  icon,
  title,
  value,
  hasArrow = false,
  hasToggle = false,
  toggleValue = false,
  onToggleChange,
  textColor = 'default',
  onPress,
  disabled = false,
}: SettingItemProps) {
  const handlePress = () => {
    if (!disabled && !hasToggle && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      activeOpacity={hasToggle ? 1 : 0.6}
      disabled={disabled || hasToggle}
    >
      {/* Icon */}
      <View className="w-8 h-8 items-center justify-center mr-3">
        <Ionicons
          name={icon}
          size={24}
          color={textColor === 'red' ? '#EF4444' : '#6B7280'}
        />
      </View>

      {/* Title */}
      <Text
        className={`flex-1 text-base ${
          textColor === 'red' ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        {title}
      </Text>

      {/* Value */}
      {value && !hasToggle && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 mr-2">{value}</Text>
      )}

      {/* Toggle Switch */}
      {hasToggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
          thumbColor={toggleValue ? '#FFFFFF' : '#F3F4F6'}
          disabled={disabled}
        />
      )}

      {/* Arrow */}
      {hasArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const { theme, setTheme } = useSettingsStore();
  const { loadItems } = useItemStore();

  // Get app version from expo config
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  // Dark mode toggle handler
  const handleDarkModeToggle = async (value: boolean) => {
    const newTheme = value ? 'dark' : 'light';
    await setTheme(newTheme);
    Appearance.setColorScheme(newTheme);
  };

  // Theme selection handler
  const handleThemeSelection = () => {
    Alert.alert(
      '테마 선택',
      '사용할 테마를 선택해주세요',
      [
        {
          text: '라이트 모드',
          onPress: async () => {
            await setTheme('light');
            Appearance.setColorScheme('light');
          },
        },
        {
          text: '다크 모드',
          onPress: async () => {
            await setTheme('dark');
            Appearance.setColorScheme('dark');
          },
        },
        {
          text: '시스템 설정 따르기',
          onPress: async () => {
            await setTheme('system');
            Appearance.setColorScheme(null);
          },
        },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  // Clear all data handler
  const handleClearAllData = () => {
    Alert.alert(
      '데이터 삭제',
      '모든 항목이 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: confirmClearAllData,
        },
      ]
    );
  };

  const confirmClearAllData = async () => {
    setIsClearing(true);
    try {
      const db = await getDatabase();

      // Clear all items
      await db.runAsync('DELETE FROM items');

      // Clear report-item links
      await db.runAsync('DELETE FROM report_items');

      // Clear custom usage purposes (keep defaults: meal, other)
      await db.runAsync(
        "DELETE FROM usage_purposes WHERE id NOT IN ('meal', 'other')"
      );

      // Clear item store
      useItemStore.getState().setItems([]);

      Alert.alert('완료', '모든 데이터가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      Alert.alert(
        '오류',
        '데이터 삭제 중 오류가 발생했습니다.\n' +
          (error instanceof Error ? error.message : '알 수 없는 오류')
      );
    } finally {
      setIsClearing(false);
    }
  };

  // Data initialization handler (reset to defaults)
  const handleDataInitialization = () => {
    Alert.alert(
      '데이터 초기화',
      '모든 데이터가 삭제되고 기본 설정으로 초기화됩니다.\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: confirmDataInitialization,
        },
      ]
    );
  };

  const confirmDataInitialization = async () => {
    setIsClearing(true);
    try {
      const db = await getDatabase();

      // Clear all items
      await db.runAsync('DELETE FROM items');

      // Clear report-item links
      await db.runAsync('DELETE FROM report_items');

      // Clear ALL usage purposes
      await db.runAsync('DELETE FROM usage_purposes');

      // Re-seed default usage purposes
      const insertStatement = `
        INSERT OR IGNORE INTO usage_purposes (id, name, name_en, icon, color, is_active, display_order)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `;

      for (const purpose of DEFAULT_USAGE_PURPOSES) {
        await db.runAsync(insertStatement, [
          purpose.id,
          purpose.name,
          purpose.name_en,
          purpose.icon,
          purpose.color,
          purpose.display_order,
        ]);
      }

      // Clear item store
      useItemStore.getState().setItems([]);

      Alert.alert(
        '완료',
        '데이터가 초기화되었습니다.\n기본 용도(식대, 기타)가 복원되었습니다.'
      );
    } catch (error) {
      console.error('Failed to initialize data:', error);
      Alert.alert(
        '오류',
        '데이터 초기화 중 오류가 발생했습니다.\n' +
          (error instanceof Error ? error.message : '알 수 없는 오류')
      );
    } finally {
      setIsClearing(false);
    }
  };

  // App info handler
  const handleAppInfo = () => {
    Alert.alert(
      '앱 정보',
      `영수증 관리 앱\n\n버전: ${appVersion}\n\n개인 카드 영수증과 법인 카드 영수증을 관리하고,\n증빙 서류를 체계적으로 정리할 수 있습니다.`
    );
  };

  // Get theme display text
  const getThemeDisplayText = () => {
    switch (theme) {
      case 'light':
        return '라이트';
      case 'dark':
        return '다크';
      case 'system':
        return '시스템 설정';
      default:
        return '시스템 설정';
    }
  };

  return (
    <>
      <Header title="설정" />
      <TabScreenContent>
        <ScrollView className="flex-1 bg-white dark:bg-gray-900">
        {/* Loading overlay */}
        {isClearing && (
          <View className="absolute inset-0 bg-black/30 items-center justify-center z-50">
            <View className="bg-white dark:bg-gray-800 rounded-lg p-6 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-4 text-gray-700 dark:text-gray-300">처리 중...</Text>
            </View>
          </View>
        )}

        {/* 설정 그룹 1: 앱 설정 */}
        <View className="mt-6">
          <Text className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
            앱 설정
          </Text>
          <View className="mt-1">
            <SettingItem
              icon="moon"
              title="테마"
              value={getThemeDisplayText()}
              hasArrow
              onPress={handleThemeSelection}
              disabled={isClearing}
            />
            <SettingItem
              icon="notifications"
              title="알림 설정"
              hasArrow
              onPress={() => Alert.alert('준비 중', '알림 설정은 추후 업데이트에서 제공될 예정입니다.')}
              disabled={isClearing}
            />
            <SettingItem
              icon="globe"
              title="언어"
              value="한국어"
              hasArrow
              onPress={() => Alert.alert('준비 중', '언어 설정은 추후 업데이트에서 제공될 예정입니다.')}
              disabled={isClearing}
            />
          </View>
        </View>

        {/* 설정 그룹 2: 관리 */}
        <View className="mt-6">
          <Text className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
            관리
          </Text>
          <View className="mt-1">
            <SettingItem
              icon="pricetags"
              title="태그 관리"
              hasArrow
              onPress={() => router.push('/settings/tags' as any)}
              disabled={isClearing}
            />
            <SettingItem
              icon="pricetag"
              title="사용처 관리"
              hasArrow
              onPress={() => router.push('/settings/usage-purposes' as any)}
              disabled={isClearing}
            />
            <SettingItem
              icon="create-outline"
              title="커스텀 필드 관리"
              hasArrow
              onPress={() => router.push('/settings/custom-fields' as any)}
              disabled={isClearing}
            />
            <SettingItem
              icon="cloud-outline"
              title="백업 및 복원"
              hasArrow
              onPress={() => router.push('/settings/backup' as any)}
              disabled={isClearing}
            />
          </View>
        </View>

        {/* 설정 그룹 3: 데이터 */}
        <View className="mt-6">
          <Text className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
            데이터
          </Text>
          <View className="mt-1">
            <SettingItem
              icon="trash-bin"
              title="데이터 삭제"
              textColor="red"
              onPress={handleClearAllData}
              disabled={isClearing}
            />
            <SettingItem
              icon="refresh"
              title="데이터 초기화"
              textColor="red"
              onPress={handleDataInitialization}
              disabled={isClearing}
            />
          </View>
        </View>

        {/* 설정 그룹 4: 정보 */}
        <View className="mt-6 mb-6">
          <Text className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
            정보
          </Text>
          <View className="mt-1">
            <SettingItem
              icon="information-circle"
              title="앱 정보"
              value={`v${appVersion}`}
              hasArrow
              onPress={handleAppInfo}
              disabled={isClearing}
            />
            <SettingItem
              icon="help-circle"
              title="도움말"
              hasArrow
              onPress={() => Alert.alert('준비 중', '도움말은 추후 업데이트에서 제공될 예정입니다.')}
              disabled={isClearing}
            />
          </View>
        </View>
        </ScrollView>
      </TabScreenContent>
    </>
  );
}
