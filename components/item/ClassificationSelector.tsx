import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveClassificationsBySpace } from '@/services/database/classificationService';
import type { Classification } from '@/types/space';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';

interface ClassificationSelectorProps {
  /** 현재 공간 ID - 해당 공간의 분류 목록을 로드하는 데 사용 */
  spaceId: string;
  /** 선택된 classification ID */
  value?: string;
  /** 분류 선택 시 호출 (classification ID 전달) */
  onChange: (id: string) => void;
}

export function ClassificationSelector({
  spaceId,
  value,
  onChange,
}: ClassificationSelectorProps) {
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const borderColor = useThemeColor(colors.light.border, colors.dark.border);
  const bgColor = useThemeColor(colors.light.surface, colors.dark.surface);
  const primaryColor = useThemeColor(colors.primary, '#60A5FA');

  const loadClassifications = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    try {
      const list = await getActiveClassificationsBySpace(spaceId);
      setClassifications(list);
      // 값이 없거나 현재 선택된 분류가 새 목록에 없을 때 첫 번째 항목 자동 선택
      if (list.length > 0 && (!value || !list.some((c) => c.id === value))) {
        onChange(list[0].id);
      }
    } catch (error) {
      console.error('Failed to load classifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, value, onChange]);

  // spaceId가 변경될 때마다 분류 목록 재로드
  useEffect(() => {
    loadClassifications();
  }, [loadClassifications]);

  if (isLoading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={primaryColor} />
      </View>
    );
  }

  if (classifications.length === 0) {
    return (
      <View className="py-4 items-center">
        <Text className="text-gray-500 dark:text-gray-400 text-sm">
          이 공간에 등록된 분류가 없습니다
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
          gap: 12,
          paddingHorizontal: 4,
          paddingVertical: 8,
        }}
      >
        {classifications.map((classification) => {
          const isSelected = value === classification.id;
          const iconName = classification.icon ?? 'folder-outline';
          const color = classification.color ?? colors.primary;

          return (
            <TouchableOpacity
              key={classification.id}
              onPress={() => onChange(classification.id)}
              className="flex-col items-center justify-center px-4 py-3 rounded-xl border-2 min-w-[110px]"
              style={{
                borderColor: isSelected ? color : borderColor,
                backgroundColor: isSelected ? `${color}15` : bgColor,
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${classification.name} 분류 선택`}
              accessibilityState={{ selected: isSelected }}
            >
              {/^[a-z0-9-]+$/.test(iconName) ? (
                <Ionicons
                  name={iconName as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={color}
                  style={{ marginBottom: 8 }}
                />
              ) : (
                <Text style={{ fontSize: 24, marginBottom: 8 }}>{iconName}</Text>
              )}
              <Text
                className={`text-base font-semibold ${
                  isSelected
                    ? 'text-gray-800 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {classification.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
