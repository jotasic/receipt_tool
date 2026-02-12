/**
 * OCR 전용 로거
 * OCR 처리 과정의 상세 로깅 및 에러 추적을 위한 유틸리티
 */

export enum OcrLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface OcrLogEntry {
  level: OcrLogLevel;
  timestamp: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class OcrLogger {
  private logs: OcrLogEntry[] = [];
  private maxLogs = 100; // 최대 로그 보관 개수

  /**
   * 로그 기록
   */
  private log(level: OcrLogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: OcrLogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context,
      error,
    };

    this.logs.push(entry);

    // 최대 로그 개수 유지
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 콘솔 출력
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` | Error: ${error.message}` : '';

    switch (level) {
      case OcrLogLevel.DEBUG:
        console.debug(`[OCR DEBUG] ${message}${contextStr}${errorStr}`);
        break;
      case OcrLogLevel.INFO:
        console.info(`[OCR INFO] ${message}${contextStr}${errorStr}`);
        break;
      case OcrLogLevel.WARN:
        console.warn(`[OCR WARN] ${message}${contextStr}${errorStr}`);
        break;
      case OcrLogLevel.ERROR:
        console.error(`[OCR ERROR] ${message}${contextStr}${errorStr}`, error);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(OcrLogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(OcrLogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(OcrLogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(OcrLogLevel.ERROR, message, context, error);
  }

  /**
   * 최근 로그 조회
   */
  getRecentLogs(count: number = 10): OcrLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 에러 로그만 조회
   */
  getErrorLogs(): OcrLogEntry[] {
    return this.logs.filter(log => log.level === OcrLogLevel.ERROR);
  }

  /**
   * 로그 초기화
   */
  clear() {
    this.logs = [];
  }

  /**
   * 전체 로그 내보내기 (디버깅용)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// 싱글톤 인스턴스
export const ocrLogger = new OcrLogger();
