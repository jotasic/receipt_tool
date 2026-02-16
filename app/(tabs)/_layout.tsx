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
    // 1depth (탭) 화면
    if (pathname === '/' || pathname === '/(tabs)') return '대시보드';
    if (pathname === '/items' || pathname === '/(tabs)/items') return '증빙';
    if (pathname === '/calendar' || pathname === '/(tabs)/calendar') return '달력';
    if (pathname === '/reports' || pathname === '/(tabs)/reports') return '정산';
    if (pathname === '/settings' || pathname === '/(tabs)/settings') return '설정';

    // 2depth 화면 (tabs 내부의 Stack)
    // index 탭의 item 상세: /(tabs)/index/item/[id]
    if (pathname.match(/\/\(tabs\)\/index\/item\/[^/]+$/) || pathname.match(/^\/item\/[^/]+$/)) {
      return '항목 상세';
    }

    // 기본값
    return '대시보드';
  };

  // Determine if back button should be shown
  const shouldShowBack = () => {
    // 2depth 화면에서는 뒤로 버튼 표시
    if (pathname.match(/\/\(tabs\)\/index\/item\/[^/]+$/) || pathname.match(/^\/item\/[^/]+$/)) {
      return true;
    }
    return false;
  };

  // Determine if tab bar should be hidden (2depth screens)
  const shouldHideTabBar = () => {
    // item 상세 화면에서는 탭바 숨김
    if (pathname.match(/\/\(tabs\)\/index\/item\/[^/]+$/) || pathname.match(/^\/item\/[^/]+$/)) {
      return true;
    }
    return false;
  };

  // Calculate bottom padding for devices with or without safe area
  const bottomPadding = MIN_PADDING;
  const tabBarHeight = TAB_BAR_HEIGHT + bottomPadding;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-white dark:bg-gray-900">
      <Header title={getHeaderTitle()} showBack={shouldShowBack()} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          // Hide default header (we use custom Header component)
          headerShown: false,
          tabBarStyle: shouldHideTabBar() ? { display: 'none' } : {
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
