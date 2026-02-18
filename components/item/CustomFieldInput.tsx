/**
 * CustomFieldInput - Dynamic input component for custom fields
 *
 * Renders different input types based on field type:
 * - text: Standard text input
 * - number: Numeric keyboard input
 * - date: Date input with format validation
 * - select: Picker/dropdown from options
 *
 * Features:
 * - Type-specific keyboards
 * - Required field validation display
 * - NativeWind styling
 * - Error state handling
 */

import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CustomField } from '@/types';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';
import { DatePickerInput } from '@/components/common';

interface CustomFieldInputProps {
  field: CustomField;
  value: string | null;
  onValueChange: (value: string | null) => void;
  error?: string;
}

export function CustomFieldInput({
  field,
  value,
  onValueChange,
  error,
}: CustomFieldInputProps) {
  const placeholderColor = useThemeColor(colors.light.text.muted, colors.dark.text.muted);
  const chevronColor = useThemeColor(colors.light.text.muted, colors.dark.text.muted);

  /**
   * Render text input
   */
  const renderTextInput = () => (
    <TextInput
      value={value || ''}
      onChangeText={onValueChange}
      placeholder={`${field.name} 입력`}
      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100"
      placeholderTextColor={placeholderColor}
      autoCapitalize="sentences"
    />
  );

  /**
   * Render number input (with comma formatting)
   */
  const renderNumberInput = () => {
    const numericValue = parseInt(value || '', 10);
    const displayValue = isNaN(numericValue) ? '' : numericValue.toLocaleString('ko-KR');
    return (
      <TextInput
        value={displayValue}
        onChangeText={(text) => onValueChange(text.replace(/[^0-9]/g, '') || null)}
        placeholder={`${field.name} 입력`}
        keyboardType="numeric"
        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100"
        placeholderTextColor={placeholderColor}
      />
    );
  };

  /**
   * Render date input using DatePickerInput component
   */
  const renderDateInput = () => (
    <DatePickerInput
      value={value || ''}
      onChange={(d) => onValueChange(d)}
    />
  );

  /**
   * Render select input with options
   */
  const renderSelectInput = () => {
    const options = field.options || [];

    return (
      <View className="w-full">
        {/* Selected value display */}
        <TouchableOpacity
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg flex-row items-center justify-between"
          onPress={() => {
            // For now, cycle through options on tap
            // Future enhancement: Show a proper picker modal
            const currentIndex = value ? options.indexOf(value) : -1;
            const nextIndex = (currentIndex + 1) % options.length;
            onValueChange(options[nextIndex] || null);
          }}
        >
          <Text className={`text-base ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-300'}`}>
            {value || `${field.name} 선택`}
          </Text>
          <Ionicons name="chevron-down" size={20} color={chevronColor} />
        </TouchableOpacity>

        {/* Options preview */}
        {options.length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-2">
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => onValueChange(option)}
                className={`px-3 py-1.5 rounded-full border ${
                  value === option
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}
              >
                <Text
                  className={`text-sm ${
                    value === option ? 'text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render appropriate input based on field type
   */
  const renderInput = () => {
    switch (field.fieldType) {
      case 'text':
        return renderTextInput();
      case 'number':
        return renderNumberInput();
      case 'date':
        return renderDateInput();
      case 'select':
        return renderSelectInput();
      default:
        return renderTextInput();
    }
  };

  return (
    <View className="mb-4">
      {/* Label */}
      <View className="flex-row items-center mb-2">
        <Text className="text-base text-gray-700 dark:text-gray-200 font-medium">
          {field.name}
        </Text>
        {field.isRequired && (
          <Text className="text-red-500 ml-1">*</Text>
        )}
      </View>

      {/* Input */}
      {renderInput()}

      {/* Error message */}
      {error && (
        <View className="flex-row items-center mt-1 ml-1">
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text className="text-sm text-red-500 ml-1">{error}</Text>
        </View>
      )}
    </View>
  );
}
