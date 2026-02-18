# 공통 컴포넌트 (Common Components)

Receipt Tool에서 사용되는 재사용 가능한 UI 컴포넌트들입니다.

## Quick Reference

| 컴포넌트 | 용도 | 위치 |
|---------|-----|------|
| DatePickerInput | 날짜 선택 입력 필드 | `components/common/DatePickerInput.tsx` |
| ImageZoomModal | 이미지 핀치 줌 모달 | `components/common/ImageZoomModal.tsx` |
| Header | 상단 헤더 (제목, 버튼) | `components/common/Header.tsx` |
| FullScreenModal | 전체 화면 모달 | `design-system/layouts/FullScreenModal.tsx` |

## 상세 문서

| 컴포넌트 | 문서 |
|---------|------|
| DatePickerInput | [Design System > DatePickerInput](/docs/architecture/design-system.md#datepickerinput) |
| ImageZoomModal | [Image Zoom Modal](/docs/components/image-zoom-modal.md) |
| Header | [Layout Policy > Header](/docs/guides/layout-policy.md) |
| FullScreenModal | [Layout Policy > FullScreenModal](/docs/guides/layout-policy.md) |

## 컴포넌트별 구현 가이드

### DatePickerInput

날짜 선택 입력 필드 (react-native-calendars 기반)

```typescript
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { useState } from 'react';

function MyForm() {
  const [date, setDate] = useState('2024-02-15');

  return (
    <DatePickerInput
      label="지출 날짜"
      value={date}
      onChange={setDate}
      error={!date ? '날짜를 선택하세요' : undefined}
    />
  );
}
```

**특징:**
- 다크모드 지원
- 범위 제한 없음 (사용자 자유 입력)
- Modal 기반 선택기
- Expo Go 호환 (native module 불필요)

### ImageZoomModal

이미지 확대/축소 보기 모달

```typescript
import { ImageZoomModal } from '@/components/common/ImageZoomModal';
import { useState } from 'react';

function ImageViewer() {
  const [showZoom, setShowZoom] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setShowZoom(true)}>
        <Image source={{ uri: 'file:///...' }} />
      </TouchableOpacity>

      <ImageZoomModal
        visible={showZoom}
        imageUri="file:///..."
        onClose={() => setShowZoom(false)}
      />
    </>
  );
}
```

**특징:**
- 핀치 줌 (1x ~ 4x)
- 팬 (드래그)
- 더블탭 줌
- 성능 최적화 (react-native-reanimated)

### Header

상단 헤더 (제목, 액션 버튼)

```typescript
import { Header } from '@/components/common/Header';

function MyScreen() {
  return (
    <>
      <Header
        title="화면 제목"
        rightElement={<TouchableOpacity>...</TouchableOpacity>}
      />
      {/* 콘텐츠 */}
    </>
  );
}
```

### FullScreenModal

전체 화면 모달 (추가/수정 폼 전용)

```typescript
import { FullScreenModal } from '@/design-system/layouts/FullScreenModal';
import { useState } from 'react';

function ItemForm() {
  const [showForm, setShowForm] = useState(false);

  const handleSave = async () => {
    // 저장 로직
    setShowForm(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowForm(true)}>
        <Text>항목 추가</Text>
      </TouchableOpacity>

      <FullScreenModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        title="새 항목"
        rightButton={{
          label: '저장',
          onPress: handleSave,
        }}
      >
        {/* 폼 콘텐츠 */}
      </FullScreenModal>
    </>
  );
}
```

## 다크모드 대응

모든 공통 컴포넌트는 다크모드를 완벽히 지원합니다:

```typescript
// DatePickerInput
<DatePickerInput ... />  // 자동 다크모드 적용

// ImageZoomModal
<ImageZoomModal ... />   // 검은색 배경 (모드 무관)

// Header
<Header ... />           // NativeWind `dark:` 클래스 사용

// FullScreenModal
<FullScreenModal ... />  // NativeWind `dark:` 클래스 사용
```

## 성능 최적화

### 메모이제이션

```typescript
import { useMemo, useCallback } from 'react';

const datePickerProps = useMemo(
  () => ({ value: date, onChange: setDate }),
  [date]
);

const handleImageClose = useCallback(() => setShowZoom(false), []);
```

### React.memo

```typescript
const MemoizedDatePicker = React.memo(DatePickerInput);
const MemoizedImageZoom = React.memo(ImageZoomModal);
```

## 체크리스트

새 화면/폼 구현 시:

- [ ] DatePickerInput 사용 (날짜 필드 있을 때)
- [ ] 이미지 프리뷰에 ImageZoomModal 제공
- [ ] Header 로 제목 표시
- [ ] 추가/수정 폼은 FullScreenModal 사용
- [ ] 다크모드 확인 (설정 > 테마 > 다크 모드)
- [ ] TypeScript 컴파일 확인 (`npx tsc --noEmit`)

## 참고

- [Design System](/docs/architecture/design-system.md) - 디자인 시스템 아키텍처
- [Layout Policy](/docs/guides/layout-policy.md) - 레이아웃 정책
- [Image Zoom Modal](/docs/components/image-zoom-modal.md) - 상세 구현 가이드
