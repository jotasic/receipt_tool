import { useLocalSearchParams } from 'expo-router';
import { MonthlyReportScreen } from '@/components/report/MonthlyReportScreen';
import { Header } from '@/components/common';

export default function MonthlyReportPage() {
  const { year, month } = useLocalSearchParams<{ year: string; month: string }>();

  return (
    <>
      <Header title={`${year}년 ${month}월 정산`} showBack />
      <MonthlyReportScreen year={year} month={month} />
    </>
  );
}
