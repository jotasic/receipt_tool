import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentType } from '@/types/document';

interface DocumentTypeOption {
  type: DocumentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = [
  {
    type: 'medical',
    label: '의료',
    icon: 'medical',
    color: '#EC4899',
  },
  {
    type: 'certificate',
    label: '증명서',
    icon: 'ribbon',
    color: '#8B5CF6',
  },
  {
    type: 'other',
    label: '기타',
    icon: 'document',
    color: '#6B7280',
  },
];

interface DocumentTypeSelectorProps {
  selectedType?: DocumentType;
  onSelect: (type: DocumentType) => void;
}

export function DocumentTypeSelector({
  selectedType,
  onSelect,
}: DocumentTypeSelectorProps) {
  return (
    <View className="w-full">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 12,
          paddingHorizontal: 4,
          paddingVertical: 8,
        }}
      >
        {DOCUMENT_TYPE_OPTIONS.map((option) => {
          const isSelected = selectedType === option.type;

          return (
            <TouchableOpacity
              key={option.type}
              onPress={() => onSelect(option.type)}
              className={`
                flex-row items-center justify-center
                px-4 py-3 rounded-xl
                border-2
                ${isSelected ? 'border-opacity-100' : 'border-gray-200'}
                ${isSelected ? 'bg-opacity-10' : 'bg-white'}
                min-w-[100px]
              `}
              style={{
                borderColor: isSelected ? option.color : '#E5E7EB',
                backgroundColor: isSelected
                  ? `${option.color}15`
                  : '#FFFFFF',
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} 문서 유형 선택`}
              accessibilityState={{ selected: isSelected }}
            >
              <Ionicons
                name={option.icon}
                size={24}
                color={option.color}
                style={{ marginRight: 8 }}
              />
              <Text
                className={`
                  text-base font-semibold
                  ${isSelected ? 'text-gray-800' : 'text-gray-600'}
                `}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
