import { Stack } from 'expo-router';

/**
 * Index 탭의 Stack Navigator
 *
 * 구조:
 * - index (홈 화면)
 * - item/[id] (항목 상세)
 *
 * 헤더는 상위 tabs/_layout.tsx에서 관리하므로 여기서는 headerShown: false
 */
export default function IndexLayout() {
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
          title: '홈',
        }}
      />
      <Stack.Screen
        name="item"
        options={{
          title: '항목',
        }}
      />
    </Stack>
  );
}
