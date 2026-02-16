import { Stack, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common';

export default function ItemLayout() {
  const pathname = usePathname();

  // Get header title based on current route
  const getHeaderTitle = () => {
    if (pathname.match(/\/item\/[^/]+$/)) return '항목 상세';
    return '항목';
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
            title: '항목 상세',
          }}
        />
      </Stack>
    </SafeAreaView>
  );
}
