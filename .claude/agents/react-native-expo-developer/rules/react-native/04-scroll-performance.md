# Scroll Performance Rules (HIGH)

**Essential rules for smooth scrolling and scroll-linked animations**

---

## Rule 1: SharedValue for Scroll Position (Never useState)

### ❌ Incorrect

```tsx
import { useState } from 'react';
import { ScrollView } from 'react-native';

// useState updates trigger re-renders → jank
const [scrollPosition, setScrollPosition] = useState(0);

const handleScroll = (event: any) => {
  setScrollPosition(event.nativeEvent.contentOffset.y); // ❌ re-render on every scroll event
};

<ScrollView
  scrollEventThrottle={16} // 60fps
  onScroll={handleScroll}
>
  {/* Content */}
</ScrollView>

// Derived state from scroll position
const [isHeaderHidden, setIsHeaderHidden] = useState(false);

const handleScroll = (event: any) => {
  const offset = event.nativeEvent.contentOffset.y;
  setIsHeaderHidden(offset > 100); // ❌ state update on every scroll
};
```

### ✅ Correct

```tsx
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

// Use SharedValue for scroll position (no re-renders)
const scrollPosition = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollPosition.value = event.contentOffset.y;
  },
});

<Animated.ScrollView
  scrollEventThrottle={16}
  onScroll={scrollHandler}
>
  {/* Content */}
</Animated.ScrollView>

// Use useDerivedValue for computed scroll state
import { useDerivedValue } from 'react-native-reanimated';

const scrollPosition = useSharedValue(0);

const isHeaderHidden = useDerivedValue(() =>
  scrollPosition.value > 100
);

const headerAnimatedStyle = useAnimatedStyle(() => ({
  opacity: isHeaderHidden.value ? 0 : 1,
  transform: [
    {
      translateY: isHeaderHidden.value ? -60 : 0,
    },
  ],
}));

<Animated.ScrollView onScroll={scrollHandler}>
  <Animated.View style={headerAnimatedStyle}>
    <Header />
  </Animated.View>
  {/* Content */}
</Animated.ScrollView>

// Multiple animated elements from scroll position
const scrollPosition = useSharedValue(0);

const headerOpacity = useDerivedValue(() =>
  interpolate(scrollPosition.value, [0, 100], [1, 0], Extrapolate.CLAMP)
);

const fabScale = useDerivedValue(() =>
  interpolate(scrollPosition.value, [100, 200], [1, 0.5], Extrapolate.CLAMP)
);
```

### Why High?

- **useState triggers re-render on every scroll event** → 60fps → 30fps or less
- **SharedValue updates don't trigger renders** → 60fps maintained
- **Difference is immediately noticeable** in user experience

### Performance Comparison

```
useState approach:
- Scroll event (60fps) → setState → React re-render → layout recalc
- Result: 20-30fps, janky scrolling

SharedValue approach:
- Scroll event (60fps) → update SharedValue → Reanimated (no React re-render)
- Result: 60fps, smooth scrolling
```

---

## Rule 2: useAnimatedScrollHandler (Proper API)

### ❌ Incorrect

```tsx
import { ScrollView } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';

// Manual scroll handling (error-prone)
const scrollPosition = useSharedValue(0);

const handleScroll = (event: any) => {
  scrollPosition.value = event.nativeEvent.contentOffset.y;
};

<Animated.ScrollView
  onScroll={handleScroll}
  scrollEventThrottle={16}
>
  {/* Content */}
</Animated.ScrollView>

// No synchronization with scroll events
const [scrollPosition, setScrollPosition] = useState(0);

useEffect(() => {
  // Trying to use state for scroll animation
  if (scrollPosition > 100) {
    // animate something
  }
}, [scrollPosition]);
```

### ✅ Correct

```tsx
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

// Proper useAnimatedScrollHandler
const scrollPosition = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollPosition.value = event.contentOffset.y;
  },
});

const animatedHeaderStyle = useAnimatedStyle(() => ({
  opacity: interpolate(
    scrollPosition.value,
    [0, 100],
    [1, 0],
    Extrapolate.CLAMP
  ),
  transform: [
    {
      translateY: interpolate(
        scrollPosition.value,
        [0, 50],
        [0, -50],
        Extrapolate.CLAMP
      ),
    },
  ],
}));

<Animated.ScrollView
  scrollEventThrottle={16}
  onScroll={scrollHandler}
>
  <Animated.View style={animatedHeaderStyle}>
    <Header />
  </Animated.View>
  {/* Content */}
</Animated.ScrollView>

// With FlatList
import { FlatList } from 'react-native';

const scrollPosition = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollPosition.value = event.contentOffset.y;
  },
});

<Animated.FlatList
  data={items}
  renderItem={renderItem}
  onScroll={scrollHandler}
  scrollEventThrottle={16}
/>

// With multiple scroll-linked animations
const scrollPosition = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollPosition.value = event.contentOffset.y;
  },
  onEndDrag: (event) => {
    // Handle end drag if needed
  },
  onMomentumEnd: (event) => {
    // Handle momentum end if needed
  },
});

const tabBarAnimatedStyle = useAnimatedStyle(() => ({
  transform: [
    {
      translateY: interpolate(
        scrollPosition.value,
        [0, 100],
        [0, -80],
        Extrapolate.CLAMP
      ),
    },
  ],
}));

const fabAnimatedStyle = useAnimatedStyle(() => ({
  opacity: interpolate(
    scrollPosition.value,
    [0, 200],
    [1, 0],
    Extrapolate.CLAMP
  ),
  transform: [
    {
      scale: interpolate(
        scrollPosition.value,
        [0, 200],
        [1, 0.5],
        Extrapolate.CLAMP
      ),
    },
  ],
}));
```

### Why High?

- **useAnimatedScrollHandler is the official API** for scroll-linked animations
- **Synchronizes scroll events with animations** → no lag
- **Supports onScroll, onEndDrag, onMomentumEnd** → full control

### Common Patterns

```tsx
// Hide header on scroll down, show on scroll up
const scrollPosition = useSharedValue(0);
const scrollDirection = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    const currentOffset = event.contentOffset.y;
    scrollDirection.value = currentOffset > scrollPosition.value ? 1 : -1;
    scrollPosition.value = currentOffset;
  },
});

const headerTranslateY = useDerivedValue(() =>
  scrollDirection.value === 1 ? -80 : 0
);

// Parallax effect
const parallaxStyle = useAnimatedStyle(() => ({
  transform: [
    {
      translateY: interpolate(
        scrollPosition.value,
        [0, 200],
        [0, -100],
        Extrapolate.CLAMP
      ),
    },
  ],
}));

// Sticky header
const isHeaderSticky = useDerivedValue(() =>
  scrollPosition.value > 100
);

const headerZIndex = useDerivedValue(() =>
  isHeaderSticky.value ? 1000 : 0
);
```

---

## Auto-Fix Patterns

When reviewing code, immediately fix:

| Pattern | Fix |
|---------|-----|
| `useState` for scroll position | Change to `useSharedValue` |
| `setScrollPosition` in onScroll | Use `useAnimatedScrollHandler` |
| Manual scroll calculation in layout effect | Use `useDerivedValue` with SharedValue |
| Scroll event updates triggering re-renders | Move to Reanimated animation |
| `ScrollView` with complex scroll logic | Use `Animated.ScrollView` + `useAnimatedScrollHandler` |

---

## References

- [Reanimated Scroll Handler](https://docs.swmansion.com/react-native-reanimated/docs/api/hooks/useAnimatedScrollHandler)
- [Scroll-Linked Animations Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/scroll-linked-animations)
- [ScrollView Performance](https://reactnative.dev/docs/optimizing-flatlist-configuration#scrollviewrenderingeach-row)
