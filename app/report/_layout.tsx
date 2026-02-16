import { Stack, usePathname, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';

export default function ReportLayout() {
  const pathname = usePathname();
  const params = useLocalSearchParams();

  // Get header title based on current route
  const getHeaderTitle = () => {
    // Monthly report: /report/monthly/2024/1
    if (pathname.match(/\/report\/monthly\/\d+\/\d+$/)) {
      const { year, month } = params;
      if (year && month) {
        return `${year}년 ${month}월 정산`;
      }
      return '월별 정산';
    }
    // Report detail: /report/[id]
    if (pathname.match(/\/report\/[^/]+$/)) return '리포트 상세';
    return '리포트';
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
          name="[id]"
          options={{
            title: '리포트 상세',
          }}
        />
        <Stack.Screen
          name="monthly"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaView>
  );
}
