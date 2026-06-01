import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common/Header';
import type { ReactNode } from 'react';

interface ModalButtonProps {
  /** 버튼 레이블 */
  label: string;
  /** 버튼 클릭 핸들러 */
  onPress: () => void;
  /** 버튼 스타일 variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 비활성화 여부 */
  disabled?: boolean;
}

interface ModalLayoutProps {
  /** 헤더 타이틀 */
  title: string;
  /** 닫기 핸들러 (기본값: 뒤로가기) */
  onClose?: () => void;
  /** 하단 버튼 배열 */
  bottomButtons?: ModalButtonProps[];
  /** 화면 컨텐츠 */
  children: ReactNode;
  /** 스크롤 가능 여부 (기본값: true) */
  scrollable?: boolean;
}

/**
 * 모달 화면 전용 레이아웃 컴포넌트
 *
 * 모달/시트 화면에 최적화된 레이아웃으로, 헤더와 하단 버튼 영역을 자동으로 처리합니다.
 * SafeAreaView edges는 ['top', 'bottom']만 적용하여 좌우 여백을 제거합니다.
 *
 * @example
 * // 기본 모달 화면
 * <ModalLayout title="리포트 생성">
 *   <FormContent />
 * </ModalLayout>
 *
 * @example
 * // 하단 버튼이 있는 모달
 * <ModalLayout
 *   title="리포트 생성"
 *   bottomButtons={[
 *     { label: '취소', onPress: handleCancel, variant: 'secondary' },
 *     { label: '생성', onPress: handleSubmit, variant: 'primary' },
 *   ]}
 * >
 *   <FormContent />
 * </ModalLayout>
 *
 * @example
 * // 커스텀 닫기 핸들러가 있는 모달
 * <ModalLayout
 *   title="상세 정보"
 *   onClose={handleCustomClose}
 * >
 *   <DetailContent />
 * </ModalLayout>
 */
export function ModalLayout({
  title,
  onClose,
  bottomButtons,
  children,
  scrollable = true,
}: ModalLayoutProps) {
  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? {
        contentContainerStyle: { flexGrow: 1 },
        className: 'flex-1 bg-white dark:bg-gray-900',
      }
    : { className: 'flex-1 bg-white dark:bg-gray-900' };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <Header
        title={title}
        showBack={true}
        rightElement={
          onClose ? (
            <TouchableOpacity onPress={onClose} accessibilityLabel="닫기">
              <Text className="text-blue-500 dark:text-blue-400 font-semibold">
                닫기
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <Container {...containerProps}>{children}</Container>

      {/* 하단 버튼 영역 */}
      {bottomButtons && bottomButtons.length > 0 && (
        <View className="flex-row gap-3 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {bottomButtons.map((button, index) => (
            <ModalButton key={index} {...button} />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

/**
 * 모달 하단 버튼 컴포넌트
 */
function ModalButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: ModalButtonProps) {
  const getButtonStyle = () => {
    if (disabled) {
      return 'bg-gray-300 dark:bg-gray-700';
    }
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'secondary':
        return 'bg-gray-200 dark:bg-gray-700';
      case 'danger':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-blue-500 dark:bg-blue-600';
    }
  };

  const getTextStyle = () => {
    if (disabled) {
      return 'text-gray-500 dark:text-gray-400';
    }
    switch (variant) {
      case 'primary':
        return 'text-white';
      case 'secondary':
        return 'text-gray-900 dark:text-gray-100';
      case 'danger':
        return 'text-white';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`flex-1 py-3 rounded-lg items-center justify-center ${getButtonStyle()}`}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text className={`font-semibold text-base ${getTextStyle()}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
