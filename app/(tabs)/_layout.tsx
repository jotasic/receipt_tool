import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Header, FloatingActionBar } from '@/components/common';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  // TabBar height calculation constants
  const TAB_BAR_HEIGHT = 60;
  const MIN_PADDING = 8;

  // Get header title based on current route
  const getHeaderTitle = () => {
    switch (pathname) {
      case '/': return '대시보드';
      case '/(tabs)': return '대시보드';
      case '/items':
      case '/(tabs)/items': return '증빙';
      case '/calendar':
      case '/(tabs)/calendar': return '달력';
      case '/reports':
      case '/(tabs)/reports': return '정산';
      case '/settings':
      case '/(tabs)/settings': return '설정';
      default: return '홈';
    }
  };

  // Get FloatingActionBar actions based on current route
  const getFloatingActions = () => {
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/items' || pathname === '/(tabs)/items') {
      return [
        {
          icon: 'add' as const,
          onPress: () => router.push('/item/add'),
          variant: 'primary' as const,
        },
      ];
    }
    // No FloatingActionBar for reports, calendar, settings
    return undefined;
  };

  // Calculate bottom padding for devices with or without safe area
  const bottomPadding = MIN_PADDING;
  const tabBarHeight = TAB_BAR_HEIGHT + bottomPadding;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white dark:bg-gray-900">
      <Header title={getHeaderTitle()} showBack={false} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          // Hide default header (we use custom Header component)
          headerShown: false,
          tabBarStyle: {
            paddingBottom: bottomPadding,
            paddingTop: 8,
            height: tabBarHeight,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="items"
          options={{
            title: '증빙',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'list' : 'list-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: '달력',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: '리포트',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Action Bar (route-based) */}
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
