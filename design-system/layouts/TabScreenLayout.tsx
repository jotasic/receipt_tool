import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common/Header';
import type { ReactNode } from 'react';

interface TabScreenLayoutProps {
  /** 헤더 타이틀 */
  title: string;
  /** 헤더 오른쪽 영역 요소 */
  rightElement?: ReactNode;
  /** 화면 컨텐츠 */
  children: ReactNode;
  /** 스크롤 가능 여부 (기본값: true) */
  scrollable?: boolean;
}

/**
 * 탭 화면 전용 레이아웃 컴포넌트
 *
 * 탭 화면(1depth)에 최적화된 레이아웃으로, 헤더를 기본으로 포함하며
 * 뒤로가기 버튼은 표시하지 않습니다.
 *
 * @example
 * // 기본 탭 화면
 * <TabScreenLayout title="증빙 관리">
 *   <ItemList />
 * </TabScreenLayout>
 *
 * @example
 * // 오른쪽 버튼이 있는 탭 화면
 * <TabScreenLayout
 *   title="리포트"
 *   rightElement={<AddButton />}
 * >
 *   <ReportList />
 * </TabScreenLayout>
 */
export function TabScreenLayout({
  title,
  rightElement,
  children,
  scrollable = true,
}: TabScreenLayoutProps) {
  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? {
        contentContainerStyle: { flexGrow: 1 },
        className: 'flex-1 bg-white dark:bg-gray-900',
      }
    : { className: 'flex-1 bg-white dark:bg-gray-900' };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <Header title={title} showBack={false} rightElement={rightElement} />
      <Container {...containerProps}>{children}</Container>
    </SafeAreaView>
  );
}
