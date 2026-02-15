import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DocumentCard } from '@/components/document';
import { getDocuments, getDocumentsByType } from '@/services/database/documentService';
import type { Document, DocumentType } from '@/types';

const FILTER_OPTIONS: Array<{
  id: DocumentType | 'all';
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'all', name: '전체', icon: 'apps' },
  { id: 'medical', name: '의료', icon: 'medical' },
  { id: 'certificate', name: '증명서', icon: 'ribbon' },
  { id: 'other', name: '기타', icon: 'document' },
];

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<DocumentType | 'all'>('all');

  // Load documents when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [selectedFilter])
  );

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs =
        selectedFilter === 'all'
          ? await getDocuments()
          : await getDocumentsByType(selectedFilter);
      setDocuments(docs);
    } catch (error) {
      console.error('Documents load error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDocuments();
  };

  const handleAddDocument = () => {
    router.push('/document/add');
  };

  const handleFilterChange = (filter: DocumentType | 'all') => {
    setSelectedFilter(filter);
  };

  const renderHeader = () => (
    <View className="mb-4">
      {/* Stats Card */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white/80 text-sm font-medium mb-1">
              등록된 서류
            </Text>
            <Text className="text-white text-3xl font-bold">
              {documents.length}건
            </Text>
          </View>
          <View className="bg-white/20 rounded-full p-4">
            <Ionicons name="documents" size={32} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="mb-4">
        <FlatList
          data={FILTER_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.id;
            return (
              <TouchableOpacity
                onPress={() => handleFilterChange(item.id)}
                className={`
                  px-4 py-2 rounded-full flex-row items-center
                  ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}
                `}
                activeOpacity={0.7}
                accessibilityLabel={`${item.name} 필터`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  className={`
                    ml-2 text-sm font-semibold
                    ${isSelected ? 'text-white' : 'text-gray-700'}
                  `}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-gray-900">
          서류 목록
        </Text>
        <Text className="text-sm text-gray-500">
          {documents.length}건
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-16">
      <View className="bg-gray-100 rounded-full p-6 mb-4">
        <Ionicons name="documents-outline" size={64} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 text-lg font-semibold mb-2">
        등록된 서류가 없습니다
      </Text>
      <Text className="text-gray-500 text-base text-center mb-6">
        {selectedFilter === 'all'
          ? '하단의 + 버튼을 눌러\n첫 서류를 등록해보세요'
          : `${FILTER_OPTIONS.find((f) => f.id === selectedFilter)?.name} 서류가 없습니다`}
      </Text>
      {selectedFilter !== 'all' && (
        <TouchableOpacity
          onPress={() => setSelectedFilter('all')}
          className="px-4 py-2 bg-blue-50 rounded-lg"
          activeOpacity={0.7}
        >
          <Text className="text-blue-600 font-medium">전체 보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDocument = ({ item }: { item: Document }) => (
    <DocumentCard document={item} />
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-gray-500">서류 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-3 bg-white border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900">서류 관리</Text>
      </View>

      {/* Document List */}
      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={handleAddDocument}
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
        accessibilityLabel="서류 추가"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
