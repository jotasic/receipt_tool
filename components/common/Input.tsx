import { View, Text, TextInput } from 'react-native';

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
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 text-base font-medium mb-2">
          {label}
        </Text>
      )}

      <TextInput
        className={`
          border rounded-lg px-4 py-3 text-base
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
          ${multiline ? 'min-h-[100px]' : ''}
        `}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
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
