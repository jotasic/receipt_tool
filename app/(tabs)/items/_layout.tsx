import { Stack } from 'expo-router';

/**
 * Items 탭의 Stack Navigator
 *
 * 구조:
 * - index (증빙 목록)
 * - item/[id] (항목 상세)
 *
 * 헤더는 각 화면에서 직접 관리하므로 여기서는 headerShown: false
 */
export default function ItemsLayout() {
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
          title: '증빙',
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
