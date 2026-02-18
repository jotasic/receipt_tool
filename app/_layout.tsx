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
import { initDatabase } from '@/services/database';
import { useSettingsStore } from '@/store/settingsStore';

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
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const { theme, loadSettings, isLoaded: settingsLoaded } = useSettingsStore();

  // Initialize database and settings on app start
  useEffect(() => {
    async function setupDatabase() {
      try {
        console.log('Initializing database...');
        await initDatabase();
        console.log('Database initialized successfully');
        setDbInitialized(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setDbError(err instanceof Error ? err : new Error('Unknown database error'));
      }
    }

    setupDatabase();
  }, []);

  // Load settings on app start
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
    if (loaded && dbInitialized && settingsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbInitialized, settingsLoaded]);

  // 폰트 미로드 시 null (스플래시 스크린이 덮음)
  if (!loaded) return null;

  const isReady = dbInitialized && settingsLoaded;

  // RootLayoutNav를 즉시 렌더링하여 내비게이션 초기화 시작
  // 로딩 오버레이로 덮어 사용자에게는 로딩 화면 표시
  return (
    <>
      <RootLayoutNav />
      {!isReady && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>로딩 중...</Text>
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
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
