import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator , Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveUsagePurposes } from '@/services/database/usagePurposeService';
import type { UsagePurpose } from '@/types/usagePurpose';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';

interface UsagePurposeSelectorProps {
  selectedPurpose?: string;
  onSelect: (purpose: string) => void;
  spaceId?: string;
}

export function UsagePurposeSelector({
  selectedPurpose,
  onSelect,
  spaceId,
}: UsagePurposeSelectorProps) {
  const borderColor = useThemeColor(colors.light.border, colors.dark.border);
  const bgColor = useThemeColor(colors.light.surface, colors.dark.surface);
  const indicatorColor = useThemeColor(colors.primary, '#60A5FA');

  const [purposes, setPurposes] = useState<UsagePurpose[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getActiveUsagePurposes(spaceId);
        if (!cancelled) {
          setPurposes(result);
        }
      } catch (error) {
        console.error('Failed to load usage purposes:', error);
        if (!cancelled) {
          setPurposes([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  if (isLoading) {
    return (
      <View className="py-3 items-center justify-center">
        <ActivityIndicator size="small" color={indicatorColor} />
      </View>
    );
  }

  if (purposes.length === 0) {
    return (
      <View className="py-3 px-1">
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {spaceId ? '이 공간에 사용처가 없습니다. 설정에서 추가해주세요.' : '사용처가 없습니다.'}
        </Text>
      </View>
    );
  }

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
        {purposes.map((purpose) => {
          const isSelected = selectedPurpose === purpose.id;
          const purposeColor = purpose.color ?? '#6B7280';
          const purposeIcon = (purpose.icon ?? 'pricetag') as keyof typeof Ionicons.glyphMap;

          return (
            <Pressable
              key={purpose.id}
              onPress={() => onSelect(purpose.id)}
              className={`
                flex-row items-center justify-center
                px-3 py-2 rounded-lg
                border-2
                min-w-[80px]
              `}
              style={{
                borderColor: isSelected ? purposeColor : borderColor,
                backgroundColor: isSelected
                  ? `${purposeColor}15`
                  : bgColor,
              }}
              accessibilityRole="button"
              accessibilityLabel={`${purpose.name} 용도 선택`}
              accessibilityState={{ selected: isSelected }}
            >
              <Ionicons
                name={purposeIcon}
                size={20}
                color={purposeColor}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`
                  text-sm font-semibold
                  ${isSelected ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}
                `}
              >
                {purpose.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
