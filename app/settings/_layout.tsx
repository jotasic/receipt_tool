import { Stack, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';

export default function SettingsLayout() {
  const pathname = usePathname();

  // Get header title based on current route
  const getHeaderTitle = () => {
    if (pathname.includes('/settings/tags')) return '태그 관리';
    if (pathname.includes('/settings/usage-purposes')) return '사용처 관리';
    if (pathname.includes('/settings/custom-fields')) return '커스텀 필드 관리';
    if (pathname.includes('/settings/backup')) return '백업 및 복원';
    return '설정';
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-white dark:bg-gray-900">
      <Header title={getHeaderTitle()} showBack={true} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaView>
  );
}
