import { Stack } from 'expo-router';

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
      <Stack.Screen
        name="add"
        options={{
          title: '항목 추가',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: '항목 수정',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
