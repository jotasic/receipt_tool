import { Stack, usePathname, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, FloatingActionBar } from '@/components/common';
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { exportMonthlySettlement } from '@/services/export';

export default function MonthlyReportLayout() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  // Get header title based on current route
  const getHeaderTitle = () => {
    const { year, month } = params;
    if (year && month) {
      return `${year}년 ${month}월 정산`;
    }
    return '월별 정산';
  };

  // Handle export
  const handleExport = useCallback(async () => {
    const { year, month } = params;
    if (!year || !month) return;

    setIsExporting(true);
    try {
      const result = await exportMonthlySettlement(parseInt(year as string), parseInt(month as string));

      if (result.success && result.filePath) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.filePath, {
            mimeType: 'application/zip',
            dialogTitle: '정산 파일 공유',
          });
        } else {
          Alert.alert('성공', '정산 파일이 생성되었습니다.');
        }
      } else {
        Alert.alert('오류', result.error || '파일 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('오류', '파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  }, [params]);

  // Get FloatingActionBar actions
  const getFloatingActions = () => {
    // Show export button on monthly report screen
    if (pathname.match(/\/report\/monthly\/\d+\/\d+$/)) {
      return [
        {
          icon: 'download-outline' as const,
          onPress: handleExport,
          loading: isExporting,
          disabled: isExporting,
          variant: 'primary' as const,
        },
      ];
    }
    return undefined;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-white dark:bg-gray-900">
      <Header title={getHeaderTitle()} showBack={true} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="[year]/[month]"
          options={{
            title: '월별 정산',
          }}
        />
      </Stack>

      {/* Floating Action Bar (export button) */}
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
