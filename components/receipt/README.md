# OcrOverlay 컴포넌트

OCR로 인식된 텍스트 영역을 이미지 위에 바운딩 박스로 표시하고, 사용자가 탭하여 해당 텍스트를 상호명/금액/날짜로 선택할 수 있는 컴포넌트입니다.

## 기능

- OCR 텍스트 인식 영역을 바운딩 박스로 시각화
- 바운딩 박스를 탭하여 텍스트 선택
- 선택 모드: 상호명, 금액, 날짜
- 선택된 항목은 색상으로 구분 표시
- 이미지 크기 자동 스케일링 (contain 모드)

## 사용 방법

### 기본 사용

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { OcrOverlay, SelectedItem } from '@/components/receipt';
import { extractTextDetailed } from '@/services/ocr';

function ReceiptScreen() {
  const [imageUri, setImageUri] = useState('file:///path/to/receipt.jpg');
  const [blocks, setBlocks] = useState([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // OCR 실행
  useEffect(() => {
    async function runOcr() {
      const result = await extractTextDetailed(imageUri);
      setBlocks(result.blocks);

      // 이미지 크기 가져오기 (Image.getSize 사용)
      Image.getSize(imageUri, (width, height) => {
        setImageSize({ width, height });
      });
    }
    runOcr();
  }, [imageUri]);

  // 항목 선택 핸들러
  const handleSelect = (item: SelectedItem) => {
    setSelectedItems(prev => [...prev, item]);
  };

  // 항목 선택 해제 핸들러
  const handleDeselect = (lineIndex: string) => {
    setSelectedItems(prev => prev.filter(item => item.lineIndex !== lineIndex));
  };

  return (
    <View style={{ flex: 1 }}>
      <OcrOverlay
        imageUri={imageUri}
        blocks={blocks}
        imageSize={imageSize}
        selectedItems={selectedItems}
        onSelectItem={handleSelect}
        onDeselectItem={handleDeselect}
      />
    </View>
  );
}
```

### 선택 모드 지정 (모달 없이 바로 선택)

```tsx
<OcrOverlay
  imageUri={imageUri}
  blocks={blocks}
  imageSize={imageSize}
  selectedItems={selectedItems}
  onSelectItem={handleSelect}
  onDeselectItem={handleDeselect}
  activeMode="amount" // 금액 모드로 고정
/>
```

### 선택된 값 추출

```tsx
// 선택된 항목에서 값 추출
const storeName = selectedItems.find(item => item.mode === 'storeName')?.text;
const amount = selectedItems.find(item => item.mode === 'amount')?.text;
const date = selectedItems.find(item => item.mode === 'date')?.text;

console.log('상호명:', storeName);
console.log('금액:', amount);
console.log('날짜:', date);
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `imageUri` | `string` | Yes | 원본 이미지 URI |
| `blocks` | `OcrBlock[]` | Yes | OCR 결과 블록 배열 |
| `imageSize` | `{ width: number; height: number }` | Yes | 이미지 원본 크기 (픽셀) |
| `selectedItems` | `SelectedItem[]` | Yes | 선택된 항목 배열 |
| `onSelectItem` | `(item: SelectedItem) => void` | Yes | 항목 선택 콜백 |
| `onDeselectItem` | `(lineIndex: string) => void` | Yes | 항목 선택 해제 콜백 |
| `activeMode` | `SelectionMode` | No | 활성 선택 모드 (없으면 탭 시 모달 표시) |

## 타입

### SelectedItem

```typescript
interface SelectedItem {
  text: string;           // 선택된 텍스트
  mode: SelectionMode;    // 선택 모드 (storeName, amount, date)
  lineIndex: string;      // 라인 인덱스 ("blockIndex-lineIndex" 형태)
}
```

### SelectionMode

```typescript
type SelectionMode = 'storeName' | 'amount' | 'date';
```

## 선택 모드별 색상

- **상호명** (storeName): 파란색 (#3B82F6)
- **금액** (amount): 초록색 (#10B981)
- **날짜** (date): 주황색 (#F59E0B)

## 주의사항

1. **이미지 크기**: `imageSize`는 원본 이미지의 실제 크기(픽셀)를 전달해야 합니다.
   ```tsx
   Image.getSize(imageUri, (width, height) => {
     setImageSize({ width, height });
   });
   ```

2. **OCR 결과**: `extractTextDetailed()` 함수를 사용하여 frame 정보가 포함된 OCR 결과를 가져와야 합니다.
   - `extractText()`는 텍스트만 반환하므로 사용 불가
   - `extractTextDetailed()`는 frame 정보를 포함한 구조화된 결과 반환

3. **ML Kit 필수**: 바운딩 박스 기능은 ML Kit의 frame 정보를 사용합니다.
   - Development Build 환경에서만 작동
   - Expo Go에서는 frame 정보가 없어 박스가 표시되지 않음

## 완전한 예제

```tsx
import { useState, useEffect } from 'react';
import { View, Image, Alert, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OcrOverlay, SelectedItem, SelectionMode } from '@/components/receipt';
import { extractTextDetailed } from '@/services/ocr';
import type { OcrBlock } from '@/services/ocr';

export default function OcrSelectionScreen({ imageUri }: { imageUri: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [blocks, setBlocks] = useState<OcrBlock[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [activeMode, setActiveMode] = useState<SelectionMode | undefined>();

  useEffect(() => {
    loadOcrData();
  }, []);

  const loadOcrData = async () => {
    try {
      setIsLoading(true);

      // 1. OCR 실행
      const result = await extractTextDetailed(imageUri);
      setBlocks(result.blocks);

      // 2. 이미지 크기 가져오기
      Image.getSize(imageUri, (width, height) => {
        setImageSize({ width, height });
      });
    } catch (error) {
      console.error('OCR 실패:', error);
      Alert.alert('오류', 'OCR 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (item: SelectedItem) => {
    // 같은 모드의 기존 선택 제거 (한 모드당 하나만 선택)
    setSelectedItems(prev => [
      ...prev.filter(i => i.mode !== item.mode),
      item,
    ]);
  };

  const handleDeselectItem = (lineIndex: string) => {
    setSelectedItems(prev => prev.filter(item => item.lineIndex !== lineIndex));
  };

  // 선택된 값들 추출
  const storeName = selectedItems.find(item => item.mode === 'storeName')?.text;
  const amount = selectedItems.find(item => item.mode === 'amount')?.text;
  const date = selectedItems.find(item => item.mode === 'date')?.text;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-gray-500">OCR 분석 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* OCR 오버레이 */}
      <View className="flex-1">
        <OcrOverlay
          imageUri={imageUri}
          blocks={blocks}
          imageSize={imageSize}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onDeselectItem={handleDeselectItem}
          activeMode={activeMode}
        />
      </View>

      {/* 선택된 값 표시 */}
      <View className="p-4 border-t border-gray-200">
        <Text className="text-sm text-gray-600">상호명: {storeName || '선택 안 됨'}</Text>
        <Text className="text-sm text-gray-600">금액: {amount || '선택 안 됨'}</Text>
        <Text className="text-sm text-gray-600">날짜: {date || '선택 안 됨'}</Text>
      </View>
    </SafeAreaView>
  );
}
```

## 스타일 커스터마이징

컴포넌트는 NativeWind (Tailwind CSS)를 사용합니다. 색상이나 스타일을 변경하려면 `OcrOverlay.tsx` 내의 `MODE_CONFIG` 객체를 수정하세요.

```typescript
const MODE_CONFIG = {
  storeName: {
    label: '상호명',
    color: '#3B82F6', // 원하는 색상으로 변경
    icon: 'business' as const,
  },
  // ...
};
```
