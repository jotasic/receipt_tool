import { View, ScrollView } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Header } from '@/components/common/Header';
import type { ReactNode } from 'react';

interface ScreenLayoutProps {
  /** 헤더 타이틀 */
  title?: string;
  /** 헤더 표시 여부 */
  showHeader?: boolean;
  /** 뒤로가기 버튼 표시 여부 */
  showBack?: boolean;
  /** 헤더 오른쪽 영역 요소 */
  rightElement?: ReactNode;
  /** 화면 컨텐츠 */
  children: ReactNode;
  /** 스크롤 가능 여부 (기본값: true) */
  scrollable?: boolean;
  /** SafeAreaView edges (기본값: ['top', 'left', 'right', 'bottom']) */
  edges?: readonly Edge[];
}

/**
 * 기본 화면 레이아웃 컴포넌트
 *
 * SafeAreaView와 Header를 자동으로 처리하여 일관된 레이아웃을 제공합니다.
 *
 * @example
 * // 헤더 없는 화면
 * <ScreenLayout>
 *   <View>컨텐츠</View>
 * </ScreenLayout>
 *
 * @example
 * // 헤더가 있는 화면
 * <ScreenLayout title="증빙 관리" showHeader>
 *   <View>컨텐츠</View>
 * </ScreenLayout>
 *
 * @example
 * // 뒤로가기 버튼이 있는 2depth 화면
 * <ScreenLayout title="리포트 생성" showHeader showBack>
 *   <View>컨텐츠</View>
 * </ScreenLayout>
 *
 * @example
 * // 오른쪽 버튼이 있는 화면
 * <ScreenLayout
 *   title="리포트"
 *   showHeader
 *   rightElement={<AddButton />}
 * >
 *   <View>컨텐츠</View>
 * </ScreenLayout>
 */
export function ScreenLayout({
  title,
  showHeader = false,
  showBack = false,
  rightElement,
  children,
  scrollable = true,
  edges = ['top', 'left', 'right', 'bottom'],
}: ScreenLayoutProps) {
  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? {
        contentContainerStyle: { flexGrow: 1 },
        className: 'flex-1 bg-white dark:bg-gray-900',
      }
    : { className: 'flex-1 bg-white dark:bg-gray-900' };

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-white dark:bg-gray-900">
      {showHeader && title && (
        <Header title={title} showBack={showBack} rightElement={rightElement} />
      )}
      <Container {...containerProps}>{children}</Container>
    </SafeAreaView>
  );
}
