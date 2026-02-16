import { Stack } from 'expo-router';

export default function ReportLayout() {
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
          title: '리포트 상세',
        }}
      />
    </Stack>
  );
}
