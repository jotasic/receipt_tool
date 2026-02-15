import { View, Text, TextInput, useColorScheme } from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
}: InputProps) {
  const colorScheme = useColorScheme();

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 dark:text-gray-200 text-base font-medium mb-2">
          {label}
        </Text>
      )}

      <TextInput
        className={`
          border rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100
          ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
          ${multiline ? 'min-h-[100px]' : ''}
        `}
        placeholder={placeholder}
        placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />

      {error && (
        <Text className="text-red-600 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
