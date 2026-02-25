/**
 * OCR 디버깅 유틸리티
 * 개발 및 문제 해결을 위한 디버깅 도구
 */

import { ocrLogger } from './logger';
import { Paths, File } from 'expo-file-system';

/**
 * OCR 로그를 파일로 내보내기
 * @param filename 저장할 파일명 (기본값: ocr-logs-{timestamp}.json)
 * @returns 저장된 파일 경로
 */
export async function exportOcrLogs(filename?: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = filename || `ocr-logs-${timestamp}.json`;
  const file = new File(Paths.document, fileName);

  const logsJson = ocrLogger.exportLogs();

  await file.write(logsJson);

  console.log('OCR 로그 내보내기 완료:', file.uri);
  return file.uri;
}

/**
 * OCR 디버그 정보 수집
 */
export interface OcrDebugInfo {
  /** 최근 로그 개수 */
  recentLogCount: number;
  /** 에러 로그 개수 */
  errorLogCount: number;
  /** 최근 에러 목록 */
  recentErrors: {
    timestamp: string;
    type: string;
    message: string;
  }[];
  /** 시스템 정보 */
  systemInfo: {
    platform: string;
    version: string;
  };
}

/**
 * OCR 디버그 정보 가져오기
 */
export function getOcrDebugInfo(): OcrDebugInfo {
  const recentLogs = ocrLogger.getRecentLogs(50);
  const errorLogs = ocrLogger.getErrorLogs();

  return {
    recentLogCount: recentLogs.length,
    errorLogCount: errorLogs.length,
    recentErrors: errorLogs.slice(-10).map(log => ({
      timestamp: log.timestamp,
      type: log.context?.errorType || 'UNKNOWN',
      message: log.message,
    })),
    systemInfo: {
      platform: process.env.EXPO_OS || 'unknown',
      version: process.env.EXPO_VERSION || 'unknown',
    },
  };
}

/**
 * OCR 통계 정보
 */
export interface OcrStatistics {
  /** 총 OCR 시도 횟수 */
  totalAttempts: number;
  /** 성공 횟수 */
  successCount: number;
  /** 실패 횟수 */
  failureCount: number;
  /** 성공률 (0-1) */
  successRate: number;
  /** 에러 타입별 분포 */
  errorDistribution: Record<string, number>;
}

/**
 * OCR 통계 계산
 */
export function getOcrStatistics(): OcrStatistics {
  const allLogs = ocrLogger.getRecentLogs(100);
  const errorLogs = ocrLogger.getErrorLogs();

  const successLogs = allLogs.filter(log => log.message.includes('추출 완료'));
  const successCount = successLogs.length;
  const failureCount = errorLogs.length;
  const totalAttempts = successCount + failureCount;

  // 에러 타입별 분포
  const errorDistribution: Record<string, number> = {};
  errorLogs.forEach(log => {
    const errorType = log.context?.errorType || 'UNKNOWN';
    errorDistribution[errorType] = (errorDistribution[errorType] || 0) + 1;
  });

  return {
    totalAttempts,
    successCount,
    failureCount,
    successRate: totalAttempts > 0 ? successCount / totalAttempts : 0,
    errorDistribution,
  };
}

/**
 * 콘솔에 OCR 디버그 정보 출력
 */
export function printOcrDebugInfo(): void {
  const debugInfo = getOcrDebugInfo();
  const statistics = getOcrStatistics();

  console.log('=== OCR Debug Info ===');
  console.log('Recent Logs:', debugInfo.recentLogCount);
  console.log('Error Logs:', debugInfo.errorLogCount);
  console.log('\n=== OCR Statistics ===');
  console.log('Total Attempts:', statistics.totalAttempts);
  console.log('Success Count:', statistics.successCount);
  console.log('Failure Count:', statistics.failureCount);
  console.log('Success Rate:', `${(statistics.successRate * 100).toFixed(2)}%`);
  console.log('\n=== Error Distribution ===');
  Object.entries(statistics.errorDistribution).forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
  });

  if (debugInfo.recentErrors.length > 0) {
    console.log('\n=== Recent Errors ===');
    debugInfo.recentErrors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.timestamp}] ${error.type}: ${error.message}`);
    });
  }
}

/**
 * OCR 로그 초기화 (디버깅용)
 */
export function clearOcrLogs(): void {
  ocrLogger.clear();
  console.log('OCR 로그 초기화 완료');
}
