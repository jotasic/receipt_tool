# OCR 서비스

이미지에서 텍스트를 추출하는 OCR 서비스입니다.

## 라이브러리

`@react-native-ml-kit/text-recognition` 사용

### 장점
- 오프라인 동작 (기기 내 ML 모델)
- 무료
- 한글 및 영어 지원
- 빠른 처리 속도

### 제약사항
- 네이티브 모듈이므로 웹에서 동작하지 않음
- Expo Go에서 테스트 불가 (개발 빌드 필요)

## 사용법

### 기본 사용

```typescript
import { extractText } from '@/services/ocr';

// 이미지에서 텍스트 추출
const text = await extractText('file:///path/to/image.jpg');
console.log(text);
```

### 상세 정보 포함

```typescript
import { extractTextDetailed } from '@/services/ocr';

// 블록/라인/요소 단위로 구조화된 결과
const result = await extractTextDetailed('file:///path/to/image.jpg');

console.log('전체 텍스트:', result.text);
console.log('블록 수:', result.blocks.length);

// 각 블록 순회
result.blocks.forEach((block, i) => {
  console.log(`블록 ${i}:`, block.text);
  block.lines.forEach((line, j) => {
    console.log(`  라인 ${j}:`, line.text);
  });
});
```

### 영수증 텍스트 추출

```typescript
import { extractReceiptText } from '@/services/ocr';

// 영수증 특화 추출 (현재는 기본 extractText와 동일)
const receiptText = await extractReceiptText('file:///path/to/receipt.jpg');
```

## 이미지 URI 형식

지원되는 URI 형식:
- `file:///absolute/path/to/image.jpg` (iOS/Android 파일 시스템)
- `content://...` (Android Content Provider)
- `/absolute/path/to/image.jpg` (절대 경로)

expo-camera나 expo-image-picker에서 반환하는 URI를 그대로 사용 가능합니다.

## 예제: 카메라 촬영 후 OCR

```typescript
import { Camera } from 'expo-camera';
import { extractText } from '@/services/ocr';

// 사진 촬영
const photo = await cameraRef.current?.takePictureAsync();

// OCR 실행
if (photo?.uri) {
  const text = await extractText(photo.uri);
  console.log('추출된 텍스트:', text);
}
```

## 예제: 갤러리에서 이미지 선택 후 OCR

```typescript
import * as ImagePicker from 'expo-image-picker';
import { extractText } from '@/services/ocr';

// 이미지 선택
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 1,
});

// OCR 실행
if (!result.canceled && result.assets[0]) {
  const text = await extractText(result.assets[0].uri);
  console.log('추출된 텍스트:', text);
}
```

## 에러 처리

```typescript
import { extractText } from '@/services/ocr';

try {
  const text = await extractText(imageUri);
  console.log(text);
} catch (error) {
  console.error('OCR 실패:', error);
  // 사용자에게 에러 메시지 표시
}
```

## 개발 빌드

ML Kit은 네이티브 모듈이므로 Expo Go에서 동작하지 않습니다.
테스트를 위해서는 개발 빌드가 필요합니다.

```bash
# iOS 개발 빌드
npx expo run:ios

# Android 개발 빌드
npx expo run:android
```

또는 EAS Build를 사용하여 개발 빌드 생성:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## 향후 개선 사항

1. **이미지 전처리**
   - 회전 보정
   - 대비 조정
   - 노이즈 제거
   - 원근 보정

2. **영수증 파싱**
   - 날짜 추출
   - 금액 추출
   - 상점명 추출
   - 카테고리 자동 분류

3. **Fallback API**
   - Google Cloud Vision API
   - 네트워크 오류 시 재시도 로직
