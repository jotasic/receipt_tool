/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Color tokens from design-system/tokens/colors.ts
      colors: {
        // Primary & Secondary
        primary: '#3B82F6',
        secondary: '#6B7280',

        // Semantic colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',

        // Classification colors
        'classification-corporate': '#10B981',
        'classification-personal': '#3B82F6',
        'classification-proof': '#8B5CF6',

        // Usage purpose colors
        'usage-meal': '#FF6B6B',
        'usage-other': '#C7CEEA',

        // Light mode
        'bg-light': '#F9FAFB',
        'surface-light': '#FFFFFF',
        'border-light': '#E5E7EB',
        'text-primary-light': '#111827',
        'text-secondary-light': '#6B7280',
        'text-muted-light': '#9CA3AF',

        // Dark mode
        'bg-dark': '#111827',
        'surface-dark': '#1F2937',
        'border-dark': '#374151',
        'text-primary-dark': '#F9FAFB',
        'text-secondary-dark': '#D1D5DB',
        'text-muted-dark': '#9CA3AF',
      },

      // Spacing tokens from design-system/tokens/spacing.ts
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
      },

      // Border radius tokens
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },

      // Typography tokens from design-system/tokens/typography.ts
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },

      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      lineHeight: {
        tight: '1.2',
        normal: '1.5',
        relaxed: '1.75',
      },

      letterSpacing: {
        tight: '-0.5px',
        normal: '0',
        wide: '0.5px',
      },
    },
  },
  plugins: [],
};
