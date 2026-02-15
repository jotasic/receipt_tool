import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common';
import {
  getDocumentById,
  deleteDocument,
} from '@/services/database/documentService';
import type { Document, DocumentType } from '@/types';

const DOCUMENT_TYPE_INFO: Record<
  DocumentType,
  { name: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  medical: { name: '의료', icon: 'medical', color: '#EC4899' },
  certificate: { name: '증명서', icon: 'ribbon', color: '#8B5CF6' },
  other: { name: '기타', icon: 'document', color: '#6B7280' },
};

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    if (!id) {
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const doc = await getDocumentById(id);

      if (!doc) {
        Alert.alert('오류', '서류를 찾을 수 없습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
        return;
      }

      setDocument(doc);
    } catch (error) {
      console.error('Document load error:', error);
      Alert.alert('오류', '서류를 불러오는 중 오류가 발생했습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '서류 삭제',
      '이 서류를 삭제하시겠습니까?\n삭제된 서류는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await deleteDocument(id);

      Alert.alert('삭제 완료', '서류가 삭제되었습니다.', [
        { text: '확인', onPress: () => router.replace('/(tabs)/documents') },
      ]);
    } catch (error) {
      console.error('Document delete error:', error);
      Alert.alert('삭제 실패', '서류 삭제 중 오류가 발생했습니다.', [
        { text: '확인' },
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    Alert.alert('준비 중', '편집 기능은 준비 중입니다.');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-gray-500">서류 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!document) {
    return null;
  }

  const typeInfo = DOCUMENT_TYPE_INFO[document.documentType || 'other'];
  const createdDate = new Date(document.createdAt);
  const updatedDate = new Date(document.updatedAt);
  const formatDate = (date: Date) =>
    date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
          서류 상세
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Image */}
        {document.filePath && (
          <View className="mb-6">
            <View
              className="w-full rounded-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Image
                source={{ uri: document.filePath }}
                className="w-full h-64 rounded-lg bg-gray-100"
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* Document Type Badge */}
        <View className="mb-4">
          <View
            className="self-start px-4 py-2 rounded-full flex-row items-center"
            style={{ backgroundColor: `${typeInfo.color}20` }}
          >
            <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
            <Text
              className="text-base font-semibold ml-2"
              style={{ color: typeInfo.color }}
            >
              {typeInfo.name}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {document.title}
          </Text>
          {document.description && (
            <Text className="text-base text-gray-600 leading-6">
              {document.description}
            </Text>
          )}
        </View>

        {/* Memo */}
        {document.memo && (
          <View className="mb-6 p-4 bg-gray-50 rounded-lg">
            <View className="flex-row items-center mb-2">
              <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              <Text className="text-base font-semibold text-gray-700 ml-2">
                메모
              </Text>
            </View>
            <Text className="text-base text-gray-600 leading-6">
              {document.memo}
            </Text>
          </View>
        )}

        {/* Metadata */}
        <View className="mb-6 p-4 bg-gray-50 rounded-lg">
          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2">
              생성일: {formatDate(createdDate)}
            </Text>
          </View>

          {document.createdAt !== document.updatedAt && (
            <View className="flex-row items-center">
              <Ionicons name="sync-outline" size={18} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                수정일: {formatDate(updatedDate)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 border-t border-gray-200">
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Button
              title="편집"
              onPress={handleEdit}
              variant="outline"
              disabled={isDeleting}
              icon={<Ionicons name="create-outline" size={20} color="#2563eb" />}
            />
          </View>
          <View className="flex-1">
            <Button
              title={isDeleting ? '삭제 중...' : '삭제'}
              onPress={handleDelete}
              variant="outline"
              disabled={isDeleting}
              loading={isDeleting}
              icon={
                !isDeleting ? (
                  <Ionicons name="trash-outline" size={20} color="#2563eb" />
                ) : undefined
              }
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
