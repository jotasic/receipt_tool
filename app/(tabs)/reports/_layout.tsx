import { Stack } from 'expo-router';

/**
 * Reports 탭의 Stack Navigator
 *
 * 구조:
 * - index (정산 목록)
 * - monthly/[year]/[month] (월별 상세 정산)
 *
 * 헤더는 각 화면에서 직접 관리하므로 여기서는 headerShown: false
 */
export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '정산',
        }}
      />
      <Stack.Screen
        name="monthly/[year]/[month]"
        options={{
          title: '월별 정산',
        }}
      />
    </Stack>
  );
}
