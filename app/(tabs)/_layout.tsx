import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Header } from '@/components/common';

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
    // 2depth 화면으로 이동하면 tabs layout이 렌더링되지 않으므로
    // 여기서는 1depth(탭) 화면만 처리
    if (pathname === '/' || pathname === '/(tabs)') return '대시보드';
    if (pathname === '/items' || pathname === '/(tabs)/items') return '증빙';
    if (pathname === '/calendar' || pathname === '/(tabs)/calendar') return '달력';
    if (pathname === '/reports' || pathname === '/(tabs)/reports') return '정산';
    if (pathname === '/settings' || pathname === '/(tabs)/settings') return '설정';

    // 2depth 화면 (/item/*, /report/*, /settings/*)은 해당 _layout.tsx에서 처리
    return '대시보드';
  };

  // Calculate bottom padding for devices with or without safe area
  const bottomPadding = MIN_PADDING;
  const tabBarHeight = TAB_BAR_HEIGHT + bottomPadding;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-white dark:bg-gray-900">
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
    </SafeAreaView>
  );
}
