import './global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Appearance, View, ActivityIndicator, Text } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { initDatabase } from '@/services/database';
import type { MigrationProgress } from '@/services/database/migrations/runner';
import { useSettingsStore } from '@/store/settingsStore';
import { useSpaceStore } from '@/store/spaceStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const overlayBgColor = useThemeColor('#ffffff', '#111827');
  const overlayIndicatorColor = useThemeColor('#2563EB', '#60A5FA');
  const overlayTextColor = useThemeColor('#6b7280', '#9CA3AF');
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  const { theme, loadSettings, isLoaded: settingsLoaded } = useSettingsStore();
  const { loadSpaces, isLoaded: spacesLoaded } = useSpaceStore();

  // DB 초기화 - 콜백을 통해 마이그레이션 진행 상황을 상태로 연결
  useEffect(() => {
    let isMounted = true;

    const onProgress = (progress: MigrationProgress) => {
      if (isMounted) setMigrationMessage(progress.message);
    };

    initDatabase(onProgress)
      .then(() => {
        if (isMounted) {
          setMigrationMessage(null);
          setDbInitialized(true);
        }
      })
      .catch((err) => {
        if (isMounted) setDbError(err instanceof Error ? err : new Error('Unknown database error'));
      });
    return () => { isMounted = false; };
  }, []);

  // Load settings on app start
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load spaces after DB is initialized
  useEffect(() => {
    if (dbInitialized) {
      loadSpaces();
    }
  }, [dbInitialized, loadSpaces]);

  // Apply theme preference
  useEffect(() => {
    if (settingsLoaded && theme && theme !== 'system') {
      Appearance.setColorScheme(theme);
    } else if (settingsLoaded && theme === 'system') {
      Appearance.setColorScheme(null);
    }
  }, [theme, settingsLoaded]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (dbError) throw dbError;
  }, [dbError]);

  useEffect(() => {
    if (loaded && dbInitialized && settingsLoaded && spacesLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbInitialized, settingsLoaded, spacesLoaded]);

  // 폰트 미로드 시 null (스플래시 스크린이 덮음)
  if (!loaded) return null;

  const isReady = dbInitialized && settingsLoaded && spacesLoaded;

  // RootLayoutNav를 즉시 렌더링하여 내비게이션 초기화 시작
  // 로딩 오버레이로 덮어 사용자에게는 로딩 화면 표시
  return (
    <>
      <RootLayoutNav />
      {!isReady && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: overlayBgColor }}>
          <ActivityIndicator size="large" color={overlayIndicatorColor} />
          <Text style={{ marginTop: 12, fontSize: 14, color: overlayTextColor }}>
            {migrationMessage ?? '로딩 중...'}
          </Text>
        </View>
      )}
    </>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* 공간 관리 - SpaceDrawer에서 진입. 뒤로가면 원래 탭으로 복귀 */}
          <Stack.Screen name="spaces-management" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
