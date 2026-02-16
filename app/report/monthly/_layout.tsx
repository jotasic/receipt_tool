import { Stack } from 'expo-router';

export default function MonthlyReportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="[year]/[month]"
        options={{
          title: '월별 정산',
        }}
      />
    </Stack>
  );
}
