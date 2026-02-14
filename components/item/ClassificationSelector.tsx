import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemClassification } from '@/types/shared';
import { CLASSIFICATIONS } from '@/constants/items';

interface ClassificationSelectorProps {
  selectedClassification?: ItemClassification;
  onSelect: (classification: ItemClassification) => void;
}

export function ClassificationSelector({
  selectedClassification,
  onSelect,
}: ClassificationSelectorProps) {
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
        {CLASSIFICATIONS.map((classification) => {
          const isSelected = selectedClassification === classification.id;
          const subtitle = classification.requiresSubmission ? '제출 필요' : '기록용';

          return (
            <TouchableOpacity
              key={classification.id}
              onPress={() => onSelect(classification.id)}
              className={`
                flex-col items-center justify-center
                px-4 py-3 rounded-xl
                border-2
                ${isSelected ? 'border-opacity-100' : 'border-gray-200'}
                ${isSelected ? 'bg-opacity-10' : 'bg-white'}
                min-w-[110px]
              `}
              style={{
                borderColor: isSelected ? classification.color : '#E5E7EB',
                backgroundColor: isSelected
                  ? `${classification.color}15`
                  : '#FFFFFF',
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${classification.name} 분류 선택`}
              accessibilityState={{ selected: isSelected }}
            >
              <Ionicons
                name={classification.icon as keyof typeof Ionicons.glyphMap}
                size={28}
                color={classification.color}
                style={{ marginBottom: 8 }}
              />
              <Text
                className={`
                  text-base font-semibold
                  ${isSelected ? 'text-gray-800' : 'text-gray-600'}
                `}
              >
                {classification.name}
              </Text>
              <Text
                className={`
                  text-xs mt-1
                  ${isSelected ? 'text-gray-600' : 'text-gray-400'}
                `}
              >
                {subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
