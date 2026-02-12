import { Stack } from 'expo-router';

export default function ReceiptLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: '영수증 추가',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: '영수증 정보 입력',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '영수증 상세',
        }}
      />
    </Stack>
  );
}
