# ImageZoomModal 컴포넌트

이미지 풀 스크린 표시 및 핀치 줌 기능을 제공하는 모달 컴포넌트입니다.

## 개요

- **경로**: `/components/common/ImageZoomModal.tsx`
- **기술**: react-native-reanimated (고성능 제스처)
- **대상**: 증빙 이미지, 영수증 사진 확대 보기

## 기능

- **핀치 줌**: 두 손가락으로 이미지 확대/축소 (1x ~ 4x)
- **팬**: 줌 상태에서 드래그하여 이미지 이동
- **더블탭 줌**: 한 번 탭으로 토글 (1x ↔ 2.5x)
- **바운더리 제한**: 화면 범위 내 팬 제한
- **스프링 애니메이션**: 줌 리셋 시 부드러운 애니메이션
- **다크모드**: 검은색 배경 (모드 무관)

## Props

```typescript
interface Props {
  visible: boolean;        // 모달 표시 여부
  imageUri: string;        // 이미지 URI (로컬 또는 원격)
  onClose: () => void;     // 닫기 콜백
}
```

## 사용 예

```typescript
import { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';

function ItemDetailScreen() {
  const [showZoom, setShowZoom] = useState(false);
  const imageUri = 'file:///path/to/receipt.jpg';

  return (
    <>
      <TouchableOpacity onPress={() => setShowZoom(true)}>
        <Text>이미지 확대 보기</Text>
      </TouchableOpacity>

      <ImageZoomModal
        visible={showZoom}
        imageUri={imageUri}
        onClose={() => setShowZoom(false)}
      />
    </>
  );
}
```

## 제스처 동작

### 핀치 줌
```
두 손가락을 벌려서 확대
→ 최대 4배까지 확대 가능
→ 잠글 시 축소
```

### 팬 (드래그)
```
줌 상태에서 한 손가락으로 드래그
→ 이미지 이동 (화면 범위 내 제한)
```

### 더블탭
```
한 번 탭 → 2.5배 줌
두 번째 탭 → 1배로 리셋
```

### 닫기
- 오른쪽 상단 X 버튼 클릭
- 화면 뒤로 가기 (Android)

## 내부 구현

### 상태 관리 (Animated Values)

```typescript
const scale = useSharedValue(1);           // 줌 배율 (1 = 원본)
const translateX = useSharedValue(0);      // X 팬 오프셋
const translateY = useSharedValue(0);      // Y 팬 오프셋
```

### 제스처 추적 (Refs)

```typescript
const lastScale = useRef(1);               // 마지막 줌 배율
const lastTranslateX = useRef(0);          // 마지막 X 위치
const lastTranslateY = useRef(0);          // 마지막 Y 위치

const initialPinchDistance = useRef(0);    // 핀치 시작 거리
const initialPinchScale = useRef(1);       // 핀치 시작 배율

const lastTapTime = useRef(0);             // 마지막 탭 시간 (더블탭 감지)
const lastTapX = useRef(0);
const lastTapY = useRef(0);
```

### 바운더리 클램핑

```typescript
function clampPan(tx: number, ty: number, currentScale: number) {
  const maxX = (screenWidth * (currentScale - 1)) / 2;
  const maxY = (screenHeight * (currentScale - 1)) / 2;
  return {
    x: clamp(tx, -maxX, maxX),
    y: clamp(ty, -maxY, maxY),
  };
}
```

줌 배율에 따라 팬 범위를 동적으로 제한합니다.

## 성능 최적화

- **Animated API**: 메인 스레드 외 실행 (60fps 유지)
- **PanResponder**: 효율적인 멀티터치 처리
- **useMemo**: 애니메이션 스타일 메모이제이션
- **useCallback**: 제스처 핸들러 메모이제이션

## 장비 지원

| 장비 | 지원 | 비고 |
|-----|------|------|
| Android | ✅ | 핀치 줌, 팬, 더블탭 모두 지원 |
| iOS | ✅ | 핀치 줌, 팬, 더블탭 모두 지원 |

## 다크모드

배경이 검은색이므로 다크모드 구분 없음:

```typescript
<View className="flex-1 bg-black">
  {/* 이미지 표시 */}
</View>
```

## 제약사항

- **최대 줌**: 4배 (성능 고려)
- **최소 줌**: 1배 (원본 크기)
- **수평 로테이션**: 지원하지 않음 (세로 모드 전용)

## 통합 예

### ItemDetailScreen에서 사용

```typescript
import { useState } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';

function ItemDetailScreen({ itemId }: { itemId: string }) {
  const [showZoom, setShowZoom] = useState(false);
  const item = useItemStore((state) =>
    state.items.find((i) => i.id === itemId)
  );

  if (!item?.imagePath) {
    return <Text>이미지 없음</Text>;
  }

  return (
    <View className="flex-1">
      <TouchableOpacity
        onPress={() => setShowZoom(true)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.imagePath }}
          style={{ width: '100%', height: 300 }}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <ImageZoomModal
        visible={showZoom}
        imageUri={item.imagePath}
        onClose={() => setShowZoom(false)}
      />
    </View>
  );
}
```

## 참고

- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) - 애니메이션 라이브러리
- [PanResponder](https://reactnative.dev/docs/panresponder) - 제스처 감지
