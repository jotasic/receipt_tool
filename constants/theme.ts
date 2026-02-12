export const theme = {
  colors: {
    primary: '#3B82F6',     // 파란색
    secondary: '#6B7280',   // 회색
    success: '#10B981',     // 초록색
    warning: '#F59E0B',     // 노란색
    error: '#EF4444',       // 빨간색
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      muted: '#9CA3AF',
    },
    border: '#E5E7EB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    '2xl': 32,
  },
};

export type Theme = typeof theme;
