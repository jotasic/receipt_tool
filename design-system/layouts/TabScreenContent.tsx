/**
 * TabScreenContent Component
 *
 * Tabs 화면의 콘텐츠를 감싸는 공통 레이아웃 컴포넌트입니다.
 * FloatingActionBar를 옵션으로 지원합니다.
 *
 * 사용 예시:
 * <TabScreenContent floatingActions={[{ icon: 'add', onPress: handleAdd, variant: 'primary' }]}>
 *   <ScrollView>...</ScrollView>
 * </TabScreenContent>
 */

import { View } from 'react-native';
import { FloatingActionBar, FloatingAction } from '@/components/common';

interface TabScreenContentProps {
  children: React.ReactNode;
  floatingActions?: FloatingAction[];
}

export function TabScreenContent({ children, floatingActions }: TabScreenContentProps) {
  return (
    <View className="flex-1">
      {children}
      {floatingActions && floatingActions.length > 0 && (
        <FloatingActionBar actions={floatingActions} />
      )}
    </View>
  );
}
