import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { SpaceDrawer } from '@/components/space/SpaceDrawer';

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

  // Calculate bottom padding for devices with or without safe area
  const bottomPadding = MIN_PADDING;
  const tabBarHeight = TAB_BAR_HEIGHT + bottomPadding;

  // Hide tab bar on 2-depth+ screens (item detail, monthly report, settings sub-screens, etc.)
  const isDeepScreen =
    pathname.includes('/item/') ||
    pathname.includes('/monthly/') ||
    pathname.includes('/settings/tags') ||
    pathname.includes('/settings/backup') ||
    pathname.includes('/settings/custom-fields') ||
    pathname.includes('/settings/usage-purposes') ||
    pathname.includes('/settings/spaces') ||
    pathname.includes('/settings/classifications');

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-white dark:bg-gray-900">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          // Hide default header (we use custom Header component)
          headerShown: false,
          tabBarStyle: isDeepScreen
            ? { display: 'none' }
            : {
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
          name="home"
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
      {/* 공간 드로어 - 전역으로 한 번만 렌더링 */}
      <SpaceDrawer />
    </SafeAreaView>
  );
}
