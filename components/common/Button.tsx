import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { ReactNode } from 'react';
import { colors } from '@/design-system/tokens/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon
}: ButtonProps) {
  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-600 dark:bg-blue-500 active:bg-blue-700 dark:active:bg-blue-600',
    secondary: 'bg-gray-600 dark:bg-gray-500 active:bg-gray-700 dark:active:bg-gray-600',
    outline: 'bg-transparent border-2 border-blue-600 dark:border-blue-500 active:bg-blue-50 dark:active:bg-blue-900/20',
  };

  const variantTextStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-blue-600 dark:text-blue-400',
  };

  const disabledStyles = {
    primary: 'bg-gray-300 dark:bg-gray-700',
    secondary: 'bg-gray-300 dark:bg-gray-700',
    outline: 'border-gray-300 dark:border-gray-600',
  };

  const disabledTextStyles = {
    primary: 'text-gray-500 dark:text-gray-400',
    secondary: 'text-gray-500 dark:text-gray-400',
    outline: 'text-gray-400 dark:text-gray-500',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-2 rounded-md',
    md: 'px-4 py-3 rounded-lg',
    lg: 'px-6 py-4 rounded-xl',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${sizeStyles[size]}
        ${isDisabled ? disabledStyles[variant] : variantStyles[variant]}
        flex-row items-center justify-center
        ${isDisabled ? 'opacity-60' : 'opacity-100'}
      `}
      activeOpacity={0.7}
    >
      {loading && (
        <View className="mr-2">
          <ActivityIndicator
            size="small"
            color={variant === 'outline' ? colors.primary : '#ffffff'}
          />
        </View>
      )}
      {!loading && icon && (
        <View className="mr-2">
          {icon}
        </View>
      )}
      <Text
        className={`
          ${textSizeStyles[size]}
          ${isDisabled ? disabledTextStyles[variant] : variantTextStyles[variant]}
          font-semibold
        `}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
