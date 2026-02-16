import { Stack, usePathname, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, FloatingActionBar } from '@/components/common';
import { useState, useEffect } from 'react';
import { getItemById, deleteItem } from '@/services/database/itemService';
import { useItemStore } from '@/store/itemStore';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export default function ItemLayout() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteItemFromStore = useItemStore((state) => state.deleteItem);

  // Get header title based on current route
  const getHeaderTitle = () => {
    if (pathname.includes('/item/add')) return '항목 추가';
    if (pathname.includes('/item/edit')) return '항목 수정';
    if (pathname.match(/\/item\/[^/]+$/)) return '항목 상세';
    return '항목';
  };

  // Handle item deletion
  const handleDelete = async () => {
    const id = params.id as string;
    if (!id) return;

    Alert.alert(
      '항목 삭제',
      '이 항목을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const item = await getItemById(id);

              // Delete image file if exists
              if (item?.filePath) {
                try {
                  const fileInfo = await FileSystem.getInfoAsync(item.filePath);
                  if (fileInfo.exists) {
                    await FileSystem.deleteAsync(item.filePath);
                  }
                } catch (fileError) {
                  console.error('File delete error:', fileError);
                }
              }

              // Delete from database
              await deleteItem(id);

              // Update store
              deleteItemFromStore(id);

              Alert.alert('삭제 완료', '항목이 삭제되었습니다.', [
                { text: '확인', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Item delete error:', error);
              Alert.alert('삭제 실패', '항목 삭제 중 오류가 발생했습니다.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Handle item edit
  const handleEdit = () => {
    const id = params.id as string;
    if (!id) return;
    router.push(`/item/edit?id=${id}`);
  };

  // Get FloatingActionBar actions based on current route
  const getFloatingActions = () => {
    // [id] screen: show edit + delete buttons
    if (pathname.match(/\/item\/[^/]+$/) && params.id) {
      return [
        {
          icon: 'create-outline' as const,
          onPress: handleEdit,
          disabled: isDeleting,
        },
        {
          icon: 'trash-outline' as const,
          onPress: handleDelete,
          disabled: isDeleting,
          loading: isDeleting,
          variant: 'danger' as const,
        },
      ];
    }
    // add/edit screens: no FloatingActionBar (they use modals with their own buttons)
    return undefined;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-white dark:bg-gray-900">
      <Header title={getHeaderTitle()} showBack={true} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="[id]"
          options={{
            title: '항목 상세',
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: '항목 추가',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="edit"
          options={{
            title: '항목 수정',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>

      {/* Floating Action Bar (route-based) */}
      {getFloatingActions() && (
        <FloatingActionBar actions={getFloatingActions()!} />
      )}
    </SafeAreaView>
  );
}
