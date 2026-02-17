# UI Components Rules (MEDIUM)

**Essential rules for using the right components and best practices**

---

## Rule 1: Pressable Instead of TouchableOpacity/TouchableHighlight

### ❌ Incorrect

```tsx
import { TouchableOpacity, TouchableHighlight } from 'react-native';

// TouchableOpacity is deprecated
<TouchableOpacity onPress={handlePress}>
  <Text>Press me</Text>
</TouchableOpacity>

// TouchableHighlight has styling limitations
<TouchableHighlight
  onPress={handlePress}
  underlayColor="#E5E7EB"
>
  <Text>Press me</Text>
</TouchableHighlight>

// TouchableWithoutFeedback hides press feedback
<TouchableWithoutFeedback onPress={handlePress}>
  <Text>Press me</Text>
</TouchableWithoutFeedback>
```

### ✅ Correct

```tsx
import { Pressable } from 'react-native';

// Pressable with onPress
<Pressable onPress={handlePress}>
  <Text>Press me</Text>
</Pressable>

// Pressable with pressed state (best practice)
<Pressable
  onPress={handlePress}
  onPressIn={() => setPressed(true)}
  onPressOut={() => setPressed(false)}
>
  {({ pressed }) => (
    <Text style={{ opacity: pressed ? 0.5 : 1 }}>
      Press me
    </Text>
  )}
</Pressable>

// Pressable with className (NativeWind)
<Pressable
  onPress={handlePress}
  className="bg-blue-500 active:bg-blue-600 p-4 rounded-lg"
>
  <Text className="text-white font-semibold">Press me</Text>
</Pressable>

// Pressable with animated feedback
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

<Pressable
  onPressIn={() => {
    scale.value = withTiming(0.95);
  }}
  onPressOut={() => {
    scale.value = withTiming(1);
  }}
>
  <Animated.View style={animatedStyle} className="bg-blue-500 p-4 rounded-lg">
    <Text className="text-white">Press me</Text>
  </Animated.View>
</Pressable>

// Disabled state
<Pressable
  onPress={handlePress}
  disabled={isLoading}
  className={isLoading ? 'opacity-50' : ''}
>
  <Text>
    {isLoading ? 'Loading...' : 'Press me'}
  </Text>
</Pressable>
```

### Why Medium?

- **Pressable is the modern standard** → better control
- **State-based feedback (pressed prop)** → more customizable
- **Better accessibility support** → improved for screen readers
- **Works with NativeWind** → cleaner styling

### Pressable Features

```tsx
// Press handlers
<Pressable
  onPress={handlePress}           // Tap released
  onPressIn={handlePressIn}       // Tap started
  onPressOut={handlePressOut}     // Tap ended or moved out
  onLongPress={handleLongPress}   // Long hold (500ms+)
  delayLongPress={800}            // Customize long press delay
>
  {({ pressed }) => (
    <View style={{ opacity: pressed ? 0.5 : 1 }} />
  )}
</Pressable>

// Accessibility
<Pressable
  onPress={handlePress}
  accessible
  accessibilityRole="button"
  accessibilityLabel="Delete item"
>
  <Text>Delete</Text>
</Pressable>

// Hit test area (increase tap target)
<Pressable
  onPress={handlePress}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
>
  <Text>Press me</Text>
</Pressable>
```

---

## Rule 2: expo-image Instead of Image (for Network Images)

### ❌ Incorrect

```tsx
import { Image } from 'react-native';

// React Native Image has no progressive loading
<Image
  source={{ uri: 'https://example.com/large-image.jpg' }}
  style={{ width: 200, height: 200 }}
/>

// No blur placeholder
<Image
  source={{ uri: image.url }}
  style={{ width: 300, height: 300 }}
/>

// No caching control
<Image
  source={{ uri: `https://api.example.com/image/${id}` }}
  style={{ width: 200, height: 200 }}
/>

// Image from local file without require
<Image
  source={{ uri: 'file:///storage/emulated/0/Pictures/photo.jpg' }}
  style={{ width: 200, height: 200 }}
/>
```

### ✅ Correct

```tsx
// Install: npm install expo-image
import { Image } from 'expo-image';

// Basic usage (better than RN Image)
<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
/>

// With blur placeholder (progressive loading)
<Image
  source={{ uri: 'https://example.com/large-image.jpg' }}
  placeholder={{
    uri: 'data:image/png;base64,...', // low-res blur
  }}
  style={{ width: 300, height: 300 }}
  contentFit="cover"
/>

// With color placeholder
<Image
  source={{ uri: image.url }}
  placeholder="rgba(128, 128, 128, 0.5)"
  style={{ width: 200, height: 200 }}
/>

// With loading and error states
import { useState } from 'react';

const ReceiptImage = ({ uri }: { uri: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <>
      {isLoading && <ActivityIndicator />}
      {hasError && <Text>Failed to load image</Text>}
      <Image
        source={{ uri }}
        style={{
          width: 200,
          height: 200,
          opacity: isLoading ? 0 : 1,
        }}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </>
  );
};

// Local file from device camera
import * as ImagePicker from 'expo-image-picker';

const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (!result.canceled) {
    setImage(result.assets[0]);
  }
};

{image && (
  <Image
    source={{ uri: image.uri }}
    style={{ width: 200, height: 200 }}
    contentFit="cover"
  />
)}

// Multiple formats/sizes (responsive)
<Image
  source={{
    uri: image.url,
    width: 200,
    height: 200,
  }}
  contentFit="cover"
  contentPosition="center"
/>
```

### Why Medium?

- **expo-image supports caching** → better performance
- **Progressive loading with placeholders** → better UX
- **Blur/color placeholders prevent layout shift** → smoother
- **Better error handling** → reliability
- **Automatic format selection** → optimization

### contentFit Options

```tsx
// cover - scales to cover container (may crop)
<Image source={uri} contentFit="cover" />

// contain - scales to fit (may have letterbox)
<Image source={uri} contentFit="contain" />

// fill - stretches to fill (may distort)
<Image source={uri} contentFit="fill" />

// scale-down - smaller of contain/original size
<Image source={uri} contentFit="scale-down" />
```

---

## Rule 3: Native Modal Usage (Over Screen Navigation)

### ❌ Incorrect

```tsx
import { useRouter } from 'expo-router';

// Navigation for modal dialogs → bad UX
const router = useRouter();

const handleOpenForm = () => {
  router.push('/item/add'); // ❌ Full screen change
};

// Modals with conditional routing
const handleEdit = (id: string) => {
  router.push(`/item/${id}/edit`); // ❌ Full screen, not modal
};

// No modal backdrop
export default function AddItemScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Text>Add Item Form</Text>
    </View>
  );
}
```

### ✅ Correct

```tsx
import { useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';

// Use Modal component for dialogs
const ItemListScreen = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <View className="flex-1">
      <Pressable
        onPress={() => setShowModal(true)}
        className="bg-blue-500 p-4 rounded-lg"
      >
        <Text className="text-white">Add Item</Text>
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <ItemForm onClose={() => setShowModal(false)} />
      </Modal>
    </View>
  );
};

// FullScreenModal wrapper (best practice)
import { SafeAreaView } from 'react-native-safe-area-context';

interface FullScreenModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FullScreenModal = ({
  visible,
  onClose,
  title,
  children,
}: FullScreenModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </Text>
          <Pressable onPress={onClose}>
            <Text className="text-blue-500">Close</Text>
          </Pressable>
        </View>
        {children}
      </SafeAreaView>
    </Modal>
  );
};

// Usage
const [showAddModal, setShowAddModal] = useState(false);

<FullScreenModal
  visible={showAddModal}
  onClose={() => setShowAddModal(false)}
  title="Add Item"
>
  <ItemForm onSubmit={handleSubmit} onCancel={() => setShowAddModal(false)} />
</FullScreenModal>

// ActionSheetIOS for iOS (native feel)
import { ActionSheetIOS } from 'react-native';

const handlePress = () => {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ['Cancel', 'Delete'],
      destructiveButtonIndex: 1,
      cancelButtonIndex: 0,
    },
    (buttonIndex) => {
      if (buttonIndex === 1) {
        handleDelete();
      }
    }
  );
};

// AlertDialog for simple prompts
import { Alert } from 'react-native';

const handleDelete = () => {
  Alert.alert(
    'Delete Item?',
    'This action cannot be undone.',
    [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      { text: 'Delete', onPress: () => confirmDelete(), style: 'destructive' },
    ]
  );
};
```

### Why Medium?

- **Modal stays in context** → better UX than full screen change
- **Backdrop shows hierarchy** → clearer to user
- **Back gesture closes modal** → intuitive
- **Faster to render** → no navigation overhead
- **Native components (ActionSheet, Alert)** → platform-appropriate

### When to Use What

```tsx
// Modal - add/edit forms, dialogs
<Modal visible={showForm}>
  <ItemForm />
</Modal>

// Alert - simple confirmation, error messages
Alert.alert('Title', 'Message', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'OK' },
])

// ActionSheetIOS - bottom action menu (iOS)
ActionSheetIOS.showActionSheetWithOptions(...)

// Screen Navigation - full page transitions
router.push('/details') // Different page in app

// SegmentedControl - tab switching within page
<SegmentedControl
  values={['Tab 1', 'Tab 2']}
  selectedIndex={selectedTab}
/>
```

---

## Auto-Fix Patterns

When reviewing code, immediately fix:

| Pattern | Fix |
|---------|-----|
| `<TouchableOpacity>` | Replace with `<Pressable>` |
| `<TouchableHighlight>` | Replace with `<Pressable>` with NativeWind |
| `<Image source={{ uri: ... }}>` for network | Use `expo-image` instead |
| `<Image>` without fallback | Add `onError` handler |
| Modal opened via `router.push` | Use `<Modal>` component instead |
| Full screen form opens with navigation | Extract to `<Modal>` with state |
| No modal backdrop (transparent overlay) | Add `Modal` with `transparent={true}` |

---

## References

- [React Native Pressable](https://reactnative.dev/docs/pressable)
- [expo-image Documentation](https://docs.expo.dev/versions/latest/sdk/image/)
- [React Native Modal](https://reactnative.dev/docs/modal)
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
