import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UsagePurpose } from '@/types/shared';
import { USAGE_PURPOSES } from '@/constants/items';

interface UsagePurposeSelectorProps {
  selectedPurpose?: UsagePurpose;
  onSelect: (purpose: UsagePurpose) => void;
}

export function UsagePurposeSelector({
  selectedPurpose,
  onSelect,
}: UsagePurposeSelectorProps) {
  return (
    <View className="w-full">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 4,
          paddingVertical: 4,
        }}
      >
        {USAGE_PURPOSES.map((purpose) => {
          const isSelected = selectedPurpose === purpose.id;

          return (
            <TouchableOpacity
              key={purpose.id}
              onPress={() => onSelect(purpose.id)}
              className={`
                flex-row items-center justify-center
                px-3 py-2 rounded-lg
                border-2
                ${isSelected ? 'border-opacity-100' : 'border-gray-200'}
                ${isSelected ? 'bg-opacity-10' : 'bg-white'}
                min-w-[80px]
              `}
              style={{
                borderColor: isSelected ? purpose.color : '#E5E7EB',
                backgroundColor: isSelected
                  ? `${purpose.color}15`
                  : '#FFFFFF',
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${purpose.name} 용도 선택`}
              accessibilityState={{ selected: isSelected }}
            >
              <Ionicons
                name={purpose.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={purpose.color}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`
                  text-sm font-semibold
                  ${isSelected ? 'text-gray-800' : 'text-gray-600'}
                `}
              >
                {purpose.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
