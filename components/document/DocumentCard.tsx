import { View, Text, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Document, DocumentType } from '@/types';

interface DocumentCardProps {
  document: Document;
}

// Document type configuration with icons and colors
const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  medical: { icon: 'medical', color: '#EC4899', label: '의료' },
  certificate: { icon: 'ribbon', color: '#8B5CF6', label: '증명서' },
  other: { icon: 'document', color: '#6B7280', label: '기타' },
};

export function DocumentCard({ document }: DocumentCardProps) {
  const documentType = document.documentType || 'other';
  const typeConfig = DOCUMENT_TYPE_CONFIG[documentType];

  const handlePress = () => {
    router.push({ pathname: '/document/[id]', params: { id: document.id } });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row bg-white p-3 rounded-lg mb-2 shadow-sm"
      activeOpacity={0.7}
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Thumbnail */}
      {document.filePath ? (
        <Image
          source={{ uri: document.filePath }}
          className="w-16 h-16 rounded-md"
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-16 h-16 rounded-md items-center justify-center"
          style={{ backgroundColor: `${typeConfig.color}15` }}
        >
          <Ionicons
            name={typeConfig.icon}
            size={28}
            color={typeConfig.color}
          />
        </View>
      )}

      {/* Information */}
      <View className="flex-1 ml-3 justify-center">
        <Text className="font-semibold text-gray-900" numberOfLines={1}>
          {document.title}
        </Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          {formatDate(document.createdAt)}
        </Text>

        {/* Document Type Badge */}
        <View className="flex-row items-center mt-1.5">
          <View
            className="px-2 py-0.5 rounded-full flex-row items-center"
            style={{ backgroundColor: `${typeConfig.color}15` }}
          >
            <Ionicons
              name={typeConfig.icon}
              size={12}
              color={typeConfig.color}
              style={{ marginRight: 4 }}
            />
            <Text
              className="text-xs font-medium"
              style={{ color: typeConfig.color }}
            >
              {typeConfig.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Chevron Icon */}
      <View className="justify-center items-center">
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}
