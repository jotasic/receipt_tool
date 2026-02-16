import { Stack, usePathname, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, FloatingActionBar } from '@/components/common';
import { useState, useEffect } from 'react';
import { loadReport, submitReport, deleteReport } from '@/services/report';
import { useReportStore } from '@/store/reportStore';
import { Alert } from 'react-native';
import type { Report } from '@/types';

export default function ReportLayout() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const deleteReportFromStore = useReportStore((state) => state.deleteReport);

  // Load report data when params change
  useEffect(() => {
    if (params.id) {
      loadReportData(params.id as string);
    }
  }, [params.id]);

  const loadReportData = async (id: string) => {
    try {
      const reportData = await loadReport(id);
      setReport(reportData);
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  };

  // Get header title based on current route
  const getHeaderTitle = () => {
    if (pathname.match(/\/report\/[^/]+$/)) return '리포트 상세';
    return '리포트';
  };

  // Handle report submission
  const handleSubmit = () => {
    const id = params.id as string;
    if (!id) return;

    Alert.alert(
      '리포트 제출',
      '이 리포트를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const updatedReport = await submitReport(id);
              setReport(updatedReport);
              useReportStore.getState().updateReport(id, { status: 'submitted' });
              Alert.alert('성공', '리포트가 제출되었습니다.');
            } catch (error) {
              Alert.alert('오류', '제출에 실패했습니다.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Handle report deletion
  const handleDelete = () => {
    const id = params.id as string;
    if (!id || !report) return;

    // Verify report is in draft status
    if (report.status !== 'draft') {
      Alert.alert('삭제 불가', 'draft 상태의 리포트만 삭제할 수 있습니다.');
      return;
    }

    Alert.alert(
      '리포트 삭제',
      '이 리포트를 삭제하시겠습니까?\n삭제된 리포트는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            if (isDeleting) return;

            try {
              setIsDeleting(true);
              await deleteReport(id);
              deleteReportFromStore(id);
              router.back();
            } catch (error) {
              console.error('Report delete error:', error);
              Alert.alert('삭제 실패', '리포트 삭제 중 오류가 발생했습니다.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Get FloatingActionBar actions based on current route and report status
  const getFloatingActions = () => {
    // [id] screen: show delete + submit buttons (only for draft status)
    if (pathname.match(/\/report\/[^/]+$/) && params.id && report?.status === 'draft') {
      return [
        {
          icon: 'trash-outline' as const,
          onPress: handleDelete,
          disabled: isDeleting || isSubmitting,
          loading: isDeleting,
          variant: 'danger' as const,
        },
        {
          icon: 'paper-plane-outline' as const,
          onPress: handleSubmit,
          disabled: isDeleting,
          loading: isSubmitting,
          variant: 'primary' as const,
        },
      ];
    }
    // No FloatingActionBar for other routes or non-draft reports
    return undefined;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-white dark:bg-gray-900">
      <Header title={getHeaderTitle()} showBack={true} />
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
        <Stack.Screen
          name="monthly"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      {/* Floating Action Bar (route-based, draft reports only) */}
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
