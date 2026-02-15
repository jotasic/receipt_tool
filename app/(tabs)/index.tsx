import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/common/Card';

export default function HomeScreen() {
  const handleAddItem = () => {
    router.push('/item/add' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-3xl font-bold text-gray-900">
            증빙 관리
          </Text>
        </View>

        {/* Monthly Expense Summary Card */}
        <View className="px-6 pb-6">
          <Card className="bg-gradient-to-br">
            <View className="mb-2">
              <Text className="text-gray-600 text-base font-medium">
                이번 달 지출
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-4xl font-bold text-blue-600">
                ₩0
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="list-outline" size={16} color="#6b7280" />
              <Text className="text-gray-600 text-sm ml-2">
                증빙 0건
              </Text>
            </View>
          </Card>
        </View>

        {/* Recent Items Section */}
        <View className="px-6 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">
              최근 증빙
            </Text>
          </View>

          {/* Empty State */}
          <Card>
            <View className="items-center py-8">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Ionicons name="list-outline" size={48} color="#9ca3af" />
              </View>
              <Text className="text-gray-500 text-base text-center">
                아직 등록된 증빙이 없습니다
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-2">
                하단의 + 버튼을 눌러 증빙을 추가해보세요
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleAddItem}
        className="absolute bottom-6 right-6 bg-blue-600 rounded-full w-16 h-16 items-center justify-center active:bg-blue-700"
        style={{
          shadowColor: '#2563eb',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}
        activeOpacity={0.8}
        accessibilityLabel="증빙 추가"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
