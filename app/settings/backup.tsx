/**
 * Backup and Restore Screen
 *
 * Provides UI for backing up and restoring app data
 */

import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import {
  createBackup,
  shareBackup,
  restoreFromBackup,
  getBackupStats,
} from '@/services/backup';
import type { BackupStats } from '@/types/backup';
import { useItemStore } from '@/store/itemStore';
import { useReportStore } from '@/store/reportStore';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 ${className}`}>
      {children}
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, icon }: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return 'bg-gray-300 dark:bg-gray-600';
    switch (variant) {
      case 'primary':
        return 'bg-blue-500';
      case 'secondary':
        return 'bg-gray-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${getBackgroundColor()} rounded-lg py-3 px-4 flex-row items-center justify-center`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color="white" style={{ marginRight: 8 }} />}
          <Text className="text-white font-semibold text-center">{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function BackupScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<BackupStats>({
    items: 0,
    tags: 0,
    reports: 0,
    customFields: 0,
    usagePurposes: 0,
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const backupStats = await getBackupStats();
      setStats(backupStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const fileUri = await createBackup();
      await shareBackup(fileUri);
      Alert.alert('성공', '백업이 생성되었습니다.');
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert(
        '오류',
        '백업 생성에 실패했습니다.\n' +
          (error instanceof Error ? error.message : '알 수 없는 오류')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      '데이터 복원',
      '기존 데이터가 모두 삭제되고 백업 파일의 데이터로 교체됩니다.\n\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await restoreFromBackup();

              // Reload stores
              await useItemStore.getState().loadItems();
              await useReportStore.getState().loadReports();

              // Reload stats
              await loadStats();

              Alert.alert('성공', '데이터가 복원되었습니다.');
            } catch (error) {
              console.error('Restore error:', error);

              // Check if user cancelled file picker
              if (error instanceof Error && error.message === 'File selection cancelled') {
                return; // Don't show error alert for cancellation
              }

              Alert.alert(
                '오류',
                '복원에 실패했습니다.\n' +
                  (error instanceof Error ? error.message : '알 수 없는 오류')
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="px-4 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 w-8 h-8 items-center justify-center"
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? '#F9FAFB' : '#111827'} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1">
              백업 및 복원
            </Text>
          </View>

        {/* Loading overlay */}
        {isLoading && (
          <View className="absolute inset-0 bg-black/30 items-center justify-center z-50">
            <View className="bg-white dark:bg-gray-800 rounded-lg p-6 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-4 text-gray-700 dark:text-gray-300">처리 중...</Text>
            </View>
          </View>
        )}

        <View className="p-4">
          {/* Info Banner */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color="#3B82F6" style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-sm text-blue-900 dark:text-blue-100 leading-5">
                  백업 파일은 모든 데이터베이스 데이터를 포함합니다.{'\n'}
                  현재 이미지 파일은 백업되지 않습니다.
                </Text>
              </View>
            </View>
          </Card>

          {/* Current Data Stats */}
          <Card>
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              현재 데이터
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="flex-row items-center">
                  <Ionicons name="receipt" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                  <Text className="text-gray-700 dark:text-gray-300">항목</Text>
                </View>
                <Text className="text-gray-900 dark:text-gray-100 font-semibold">
                  {stats.items}건
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="flex-row items-center">
                  <Ionicons name="pricetags" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                  <Text className="text-gray-700 dark:text-gray-300">태그</Text>
                </View>
                <Text className="text-gray-900 dark:text-gray-100 font-semibold">
                  {stats.tags}개
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="flex-row items-center">
                  <Ionicons name="document-text" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                  <Text className="text-gray-700 dark:text-gray-300">리포트</Text>
                </View>
                <Text className="text-gray-900 dark:text-gray-100 font-semibold">
                  {stats.reports}건
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="flex-row items-center">
                  <Ionicons name="cube" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                  <Text className="text-gray-700 dark:text-gray-300">사용처</Text>
                </View>
                <Text className="text-gray-900 dark:text-gray-100 font-semibold">
                  {stats.usagePurposes}개
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2">
                <View className="flex-row items-center">
                  <Ionicons name="list" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                  <Text className="text-gray-700 dark:text-gray-300">커스텀 필드</Text>
                </View>
                <Text className="text-gray-900 dark:text-gray-100 font-semibold">
                  {stats.customFields}개
                </Text>
              </View>
            </View>
          </Card>

          {/* Backup Actions */}
          <Card>
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              백업
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              현재 데이터를 JSON 파일로 내보냅니다.
            </Text>
            <Button
              title="백업 생성 및 내보내기"
              onPress={handleCreateBackup}
              loading={isLoading}
              disabled={isLoading}
              icon="cloud-upload-outline"
            />
          </Card>

          {/* Restore Actions */}
          <Card className="border border-red-200 dark:border-red-800">
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              복원
            </Text>
            <View className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-4">
              <View className="flex-row items-start">
                <Ionicons name="warning" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                <Text className="text-sm text-red-800 dark:text-red-200 flex-1">
                  복원 시 현재 데이터가 모두 삭제됩니다.{'\n'}
                  이 작업은 되돌릴 수 없습니다.
                </Text>
              </View>
            </View>
            <Button
              title="백업 파일에서 복원"
              onPress={handleRestore}
              variant="danger"
              loading={isLoading}
              disabled={isLoading}
              icon="cloud-download-outline"
            />
          </Card>

          {/* Help Section */}
          <Card className="bg-gray-50 dark:bg-gray-700/50">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              도움말
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400 leading-5 mb-2">
              • 백업 파일은 JSON 형식으로 저장됩니다.
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400 leading-5 mb-2">
              • 백업 시 현재 모든 데이터베이스 데이터가 포함됩니다.
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400 leading-5 mb-2">
              • 복원 시 백업 파일을 선택하면 자동으로 데이터가 복원됩니다.
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400 leading-5">
              • 중요한 데이터는 주기적으로 백업하는 것을 권장합니다.
            </Text>
          </Card>
        </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
