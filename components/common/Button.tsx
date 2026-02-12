import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { ReactNode } from 'react';

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
    primary: 'bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-600 active:bg-gray-700',
    outline: 'bg-transparent border-2 border-blue-600 active:bg-blue-50',
  };

  const variantTextStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-blue-600',
  };

  const disabledStyles = {
    primary: 'bg-gray-300',
    secondary: 'bg-gray-300',
    outline: 'border-gray-300',
  };

  const disabledTextStyles = {
    primary: 'text-gray-500',
    secondary: 'text-gray-500',
    outline: 'text-gray-400',
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
            color={variant === 'outline' ? '#2563eb' : '#ffffff'}
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
