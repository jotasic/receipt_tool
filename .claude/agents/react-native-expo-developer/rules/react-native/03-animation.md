# Animation Rules (HIGH)

**Essential rules for performant 60fps animations using Reanimated**

---

## Rule 1: GPU Properties Only (transform/opacity)

### ❌ Incorrect

```tsx
import Animated, { Easing } from 'react-native-reanimated';

// Animating width/height → causes layout recalculation on every frame
const animatedStyle = useAnimatedStyle(() => ({
  width: interpolate(progress.value, [0, 1], [100, 300]),
  height: interpolate(progress.value, [0, 1], [100, 200]),
  backgroundColor: 'blue', // ❌ cannot animate color this way
}));

<Animated.View style={[styles.box, animatedStyle]} />

// Animating position with marginLeft → layout shift
const animatedStyle = useAnimatedStyle(() => ({
  marginLeft: interpolate(progress.value, [0, 1], [0, 100]),
}));

// Animating padding → triggers layout recalculation
const animatedStyle = useAnimatedStyle(() => ({
  paddingLeft: interpolate(progress.value, [0, 1], [0, 20]),
}));
```

### ✅ Correct

```tsx
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withSpring,
} from 'react-native-reanimated';

// Use transform: translateX/Y (GPU accelerated)
const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    {
      translateX: interpolate(
        progress.value,
        [0, 1],
        [0, 100],
        Extrapolate.CLAMP
      ),
    },
  ],
}));

<Animated.View style={[styles.box, animatedStyle]} />

// Animate opacity (GPU accelerated)
const animatedStyle = useAnimatedStyle(() => ({
  opacity: interpolate(progress.value, [0, 1], [0, 1]),
}));

// Animate scale with transform
const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    {
      scale: interpolate(progress.value, [0, 1], [0.5, 1]),
    },
  ],
}));

// Combine multiple transforms
const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: offsetX.value },
    { translateY: offsetY.value },
    { scale: scale.value },
    { rotate: `${rotation.value}deg` },
  ],
}));
```

### Why High?

- **Only transform/opacity run on GPU** → 60fps guaranteed
- **Layout properties (width, height, margin, padding) cause main thread work** → drops to 30fps or less
- **Result: Jank, dropped frames, worse UX**

### GPU-Safe Properties

| Safe ✅ | Avoid ❌ |
|--------|---------|
| `transform: translateX/Y` | `marginLeft/Right/Top/Bottom` |
| `opacity` | `width/height` |
| `scale` | `padding` |
| `rotate` | `left/right/top/bottom` |
| `skewX/skewY` | `backgroundColor` (use separate animated view) |

---

## Rule 2: useDerivedValue Preferred (Not useAnimatedStyle for Complex Logic)

### ❌ Incorrect

```tsx
// Computing same value in multiple useAnimatedStyle hooks
const animatedStyle1 = useAnimatedStyle(() => ({
  opacity: interpolate(progress.value, [0, 1], [0, 1]),
  transform: [
    { scale: interpolate(progress.value, [0, 1], [0.5, 1]) }
  ],
}));

const animatedStyle2 = useAnimatedStyle(() => ({
  // Same calculation repeated
  opacity: interpolate(progress.value, [0, 1], [0, 1]),
}));

// Complex conditional logic in useAnimatedStyle
const animatedStyle = useAnimatedStyle(() => {
  const opacity = progress.value < 0.5
    ? progress.value * 2
    : 2 - progress.value * 2;

  return { opacity };
});
```

### ✅ Correct

```tsx
import { useDerivedValue, useAnimatedStyle } from 'react-native-reanimated';

// Compute once, reuse in multiple places
const opacity = useDerivedValue(() =>
  interpolate(progress.value, [0, 1], [0, 1])
);

const scale = useDerivedValue(() =>
  interpolate(progress.value, [0, 1], [0.5, 1])
);

const animatedStyle1 = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }],
}));

const animatedStyle2 = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

// Complex logic in useDerivedValue
const easeOutQuad = useDerivedValue(() => {
  const t = progress.value;
  return 1 - Math.pow(1 - t, 2);
});

const animatedStyle = useAnimatedStyle(() => ({
  opacity: easeOutQuad.value,
}));

// Simplify useAnimatedStyle, move logic to useDerivedValue
const isExpanded = useDerivedValue(() => progress.value > 0.5);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { scaleY: isExpanded.value ? 1 : 0.5 }
  ],
}));
```

### Why High?

- **useDerivedValue computes once, reuses value** → more efficient
- **Separates logic from styling** → cleaner code
- **Better for complex animations** → easier to debug

---

## Rule 3: withTiming/withSpring Usage (Correct API)

### ❌ Incorrect

```tsx
import Animated from 'react-native-reanimated';

// Animate not imported
const progress = useSharedValue(0);

const handlePress = () => {
  // Using string animation (old API)
  progress.value = withTiming(1, { duration: 300 });
};

// Starting animation without proper cleanup
useEffect(() => {
  progress.value = withTiming(1);
  // Missing cleanup callback
}, []);

// Not using easing function
const handlePress = () => {
  progress.value = withTiming(1, { duration: 300 }); // ❌ linear by default
};
```

### ✅ Correct

```tsx
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const progress = useSharedValue(0);

// withTiming with easing
const handlePress = () => {
  progress.value = withTiming(1, {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  });
};

// withSpring for bouncy animations
const handlePress = () => {
  progress.value = withSpring(1, {
    damping: 10,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 2,
    restDisplacementThreshold: 2,
  });
};

// Cleanup with callback
const handlePress = () => {
  progress.value = withTiming(
    1,
    { duration: 300, easing: Easing.ease },
    (isFinished) => {
      if (isFinished) {
        runOnJS(onAnimationEnd)();
      }
    }
  );
};

// Chaining animations
const handlePress = () => {
  progress.value = withTiming(1, { duration: 300 });
  rotation.value = withTiming(360, { duration: 300 });
};

// Reverse animation
const handlePress = () => {
  progress.value = withTiming(progress.value === 0 ? 1 : 0, {
    duration: 300,
    easing: Easing.ease,
  });
};
```

### Common Easing Functions

```tsx
// Smooth easing (recommended for most animations)
Easing.ease
Easing.inOut(Easing.ease)

// Easing for UI interactions
Easing.bezier(0.25, 0.1, 0.25, 1.0) // cubic-bezier

// Bouncy easing
Easing.elastic(1)

// Spring-like
Easing.bounce
```

### Why High?

- **withTiming requires proper easing** → poor UX without it
- **withSpring is better for interactive animations** → feels natural
- **Callback cleanup prevents memory leaks**

---

## Auto-Fix Patterns

When reviewing code, immediately fix:

| Pattern | Fix |
|---------|-----|
| Animating `width/height/padding` | Change to `transform: translateX/Y` or `scale` |
| Animating `marginLeft` | Use `transform: translateX` |
| Multiple useAnimatedStyle with same logic | Extract to `useDerivedValue` |
| `withTiming` without easing | Add `easing: Easing.ease` or similar |
| No callback in animation | Add `(isFinished) => { ... }` callback |
| Animating color in useAnimatedStyle | Use separate opacity animation with Reanimated color type |

---

## References

- [Reanimated 2 Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Animations Best Practices](https://docs.swmansion.com/react-native-reanimated/docs/guides/best-practices)
- [useAnimatedStyle](https://docs.swmansion.com/react-native-reanimated/docs/api/hooks/useAnimatedStyle)
- [withTiming/withSpring](https://docs.swmansion.com/react-native-reanimated/docs/api/animations)
