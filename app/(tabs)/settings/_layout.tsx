import { Stack } from 'expo-router';

/**
 * Settings 탭의 Stack Navigator
 *
 * 구조:
 * - index (설정 메인)
 * - tags (태그 관리)
 * - backup (백업 및 복원)
 * - custom-fields (커스텀 필드 관리)
 * - usage-purposes (사용처 관리)
 *
 * 헤더는 각 화면에서 직접 관리하므로 여기서는 headerShown: false
 */
export default function SettingsLayout() {
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
          title: '설정',
        }}
      />
      <Stack.Screen
        name="tags"
        options={{
          title: '태그 관리',
        }}
      />
      <Stack.Screen
        name="backup"
        options={{
          title: '백업 및 복원',
        }}
      />
      <Stack.Screen
        name="custom-fields"
        options={{
          title: '커스텀 필드 관리',
        }}
      />
      <Stack.Screen
        name="usage-purposes"
        options={{
          title: '사용처 관리',
        }}
      />
    </Stack>
  );
}
