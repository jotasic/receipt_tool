import { Stack } from 'expo-router';

/**
 * Item Stack Navigator (항목 상세 화면) - Reports 탭
 *
 * 헤더는 ItemDetailScreen에서 직접 관리하므로 여기서는 headerShown: false
 */
export default function ItemLayout() {
  return (
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
  );
}
