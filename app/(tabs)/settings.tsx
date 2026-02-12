import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  hasArrow?: boolean;
  hasToggle?: boolean;
  textColor?: 'default' | 'red';
  onPress?: () => void;
}

function SettingItem({
  icon,
  title,
  value,
  hasArrow = false,
  hasToggle = false,
  textColor = 'default',
  onPress,
}: SettingItemProps) {
  const [toggleValue, setToggleValue] = useState(false);

  const handlePress = () => {
    if (hasToggle) {
      setToggleValue(!toggleValue);
      Alert.alert('설정 변경', `${title}: ${!toggleValue ? '켜짐' : '꺼짐'}`);
    } else if (onPress) {
      onPress();
    } else {
      Alert.alert('설정 항목', title);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
      activeOpacity={0.6}
    >
      {/* Icon */}
      <View className="w-8 h-8 items-center justify-center mr-3">
        <Ionicons
          name={icon}
          size={24}
          color={textColor === 'red' ? '#EF4444' : '#6B7280'}
        />
      </View>

      {/* Title */}
      <Text
        className={`flex-1 text-base ${
          textColor === 'red' ? 'text-red-500' : 'text-gray-900'
        }`}
      >
        {title}
      </Text>

      {/* Value */}
      {value && !hasToggle && (
        <Text className="text-sm text-gray-500 mr-2">{value}</Text>
      )}

      {/* Toggle Switch */}
      {hasToggle && (
        <Switch
          value={toggleValue}
          onValueChange={(newValue) => {
            setToggleValue(newValue);
            Alert.alert('설정 변경', `${title}: ${newValue ? '켜짐' : '꺼짐'}`);
          }}
          trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
          thumbColor={toggleValue ? '#FFFFFF' : '#F3F4F6'}
        />
      )}

      {/* Arrow */}
      {hasArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-6 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">설정</Text>
        </View>

        {/* 설정 그룹 1: 앱 설정 */}
        <View className="mt-6">
          <Text className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase">
            앱 설정
          </Text>
          <View className="mt-1">
            <SettingItem icon="moon" title="다크 모드" hasToggle />
            <SettingItem
              icon="notifications"
              title="알림 설정"
              hasArrow
              onPress={() => Alert.alert('알림 설정', '알림 설정 화면으로 이동합니다.')}
            />
            <SettingItem
              icon="globe"
              title="언어"
              value="한국어"
              hasArrow
              onPress={() => Alert.alert('언어 설정', '언어 선택 화면으로 이동합니다.')}
            />
          </View>
        </View>

        {/* 설정 그룹 2: 데이터 */}
        <View className="mt-6">
          <Text className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase">
            데이터
          </Text>
          <View className="mt-1">
            <SettingItem
              icon="cloud-upload"
              title="데이터 백업"
              hasArrow
              onPress={() => Alert.alert('데이터 백업', '데이터를 백업합니다.')}
            />
            <SettingItem
              icon="cloud-download"
              title="데이터 복원"
              hasArrow
              onPress={() => Alert.alert('데이터 복원', '데이터를 복원합니다.')}
            />
            <SettingItem
              icon="trash"
              title="데이터 초기화"
              textColor="red"
              onPress={() =>
                Alert.alert(
                  '데이터 초기화',
                  '모든 데이터가 삭제됩니다. 계속하시겠습니까?',
                  [
                    { text: '취소', style: 'cancel' },
                    { text: '초기화', style: 'destructive' },
                  ]
                )
              }
            />
          </View>
        </View>

        {/* 설정 그룹 3: 정보 */}
        <View className="mt-6 mb-6">
          <Text className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase">
            정보
          </Text>
          <View className="mt-1">
            <SettingItem
              icon="information-circle"
              title="앱 정보"
              value="v1.0.0"
              hasArrow
              onPress={() => Alert.alert('앱 정보', '영수증 관리 앱 v1.0.0')}
            />
            <SettingItem
              icon="help-circle"
              title="도움말"
              hasArrow
              onPress={() => Alert.alert('도움말', '도움말 화면으로 이동합니다.')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
