import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemCard } from '@/components/item/ItemCard';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';
import { colors } from '@/design-system/tokens/colors';
import type { Item } from '@/types/item';

interface AgendaListProps {
  items: Item[];
  selectedDate: string; // YYYY-MM-DD
}

/**
 * Formats date to Korean format: "3월 2일 월요일"
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayName = dayNames[date.getDay()];

  return `${month}월 ${day}일 ${dayName}`;
}

export function AgendaList({ items, selectedDate }: AgendaListProps) {
  const iconColor = useThemeColor(colors.light.text.muted, colors.dark.text.muted);

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Date Header */}
      <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {formatDate(selectedDate)}
        </Text>
      </View>

      {/* Items List or Empty State */}
      <View className="p-4">
        {items.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="receipt-outline" size={64} color={iconColor} />
            <Text className="text-gray-500 dark:text-gray-400 mt-4 text-base">
              이 날짜에 등록된 증빙이 없습니다
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <ItemCard key={item.id} item={item} showDate={false} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
