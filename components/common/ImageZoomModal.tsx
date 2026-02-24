import { useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/design-system/hooks/useThemeColor';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_DELAY = 300;

interface Props {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export function ImageZoomModal({ visible, imageUri, onClose }: Props) {
  const insets = useSafeAreaInsets();
  // 모달은 항상 검정 배경 위에 표시되므로 라이트/다크 모두 흰색 사용
  const closeIconColor = useThemeColor('#FFFFFF', '#FFFFFF');
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Animated values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Gesture tracking refs (raw values during gesture, not reactive)
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  // Pinch gesture tracking
  const initialPinchDistance = useRef(0);
  const initialPinchScale = useRef(1);

  // Double tap tracking
  const lastTapTime = useRef(0);
  const lastTapX = useRef(0);
  const lastTapY = useRef(0);

  const resetTransform = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  }, [scale, translateX, translateY]);

  const handleClose = useCallback(() => {
    resetTransform();
    onClose();
  }, [resetTransform, onClose]);

  // Clamp pan to content bounds based on current scale
  function clampPan(
    tx: number,
    ty: number,
    currentScale: number
  ): { x: number; y: number } {
    'worklet';
    const maxX = (screenWidth * (currentScale - 1)) / 2;
    const maxY = (screenHeight * (currentScale - 1)) / 2;
    return {
      x: clamp(tx, -maxX, maxX),
      y: clamp(ty, -maxY, maxY),
    };
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Respond to multi-touch or significant movement
        return (
          gestureState.numberActiveTouches > 1 ||
          Math.abs(gestureState.dx) > 2 ||
          Math.abs(gestureState.dy) > 2
        );
      },

      onPanResponderGrant: (event) => {
        const touches = event.nativeEvent.touches;

        if (touches.length === 2) {
          // Pinch start: calculate initial distance
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
          initialPinchScale.current = lastScale.current;
        }
      },

      onPanResponderMove: (event, gestureState) => {
        const touches = event.nativeEvent.touches;

        if (touches.length === 2) {
          // Pinch zoom
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);

          if (initialPinchDistance.current > 0) {
            const scaleRatio = currentDistance / initialPinchDistance.current;
            const newScale = clamp(
              initialPinchScale.current * scaleRatio,
              MIN_SCALE,
              MAX_SCALE
            );
            scale.value = newScale;

            // Also clamp pan while scaling
            const clamped = clampPan(
              lastTranslateX.current,
              lastTranslateY.current,
              newScale
            );
            translateX.value = clamped.x;
            translateY.value = clamped.y;
          }
        } else if (touches.length === 1 && lastScale.current > 1) {
          // Pan when zoomed in
          const newX = lastTranslateX.current + gestureState.dx;
          const newY = lastTranslateY.current + gestureState.dy;
          const clamped = clampPan(newX, newY, lastScale.current);
          translateX.value = clamped.x;
          translateY.value = clamped.y;
        }
      },

      onPanResponderRelease: (event, gestureState) => {
        const touches = event.nativeEvent.touches;

        if (touches.length === 0) {
          // Save current scale and pan as "last" values
          lastScale.current = scale.value;
          lastTranslateX.current = translateX.value;
          lastTranslateY.current = translateY.value;

          // Snap back if scale went below minimum (edge case)
          if (scale.value < MIN_SCALE) {
            scale.value = withSpring(MIN_SCALE);
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            lastScale.current = MIN_SCALE;
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
          }
        }

        // Double tap detection (single finger, minimal movement)
        if (
          gestureState.numberActiveTouches === 0 &&
          Math.abs(gestureState.dx) < 10 &&
          Math.abs(gestureState.dy) < 10 &&
          event.nativeEvent.changedTouches.length === 1
        ) {
          const now = Date.now();
          const tapX = event.nativeEvent.changedTouches[0].pageX;
          const tapY = event.nativeEvent.changedTouches[0].pageY;
          const timeDiff = now - lastTapTime.current;
          const distX = Math.abs(tapX - lastTapX.current);
          const distY = Math.abs(tapY - lastTapY.current);

          if (timeDiff < DOUBLE_TAP_DELAY && distX < 30 && distY < 30) {
            // Double tap: toggle zoom
            if (lastScale.current > 1) {
              // Reset
              scale.value = withSpring(MIN_SCALE, { damping: 20, stiffness: 200 });
              translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
              translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
              lastScale.current = MIN_SCALE;
              lastTranslateX.current = 0;
              lastTranslateY.current = 0;
            } else {
              // Zoom in toward tap point
              const centerX = screenWidth / 2;
              const centerY = screenHeight / 2;
              const offsetX = (centerX - tapX) * (DOUBLE_TAP_ZOOM - 1);
              const offsetY = (centerY - tapY) * (DOUBLE_TAP_ZOOM - 1);
              const clamped = clampPan(offsetX, offsetY, DOUBLE_TAP_ZOOM);

              scale.value = withSpring(DOUBLE_TAP_ZOOM, { damping: 20, stiffness: 200 });
              translateX.value = withSpring(clamped.x, { damping: 20, stiffness: 200 });
              translateY.value = withSpring(clamped.y, { damping: 20, stiffness: 200 });
              lastScale.current = DOUBLE_TAP_ZOOM;
              lastTranslateX.current = clamped.x;
              lastTranslateY.current = clamped.y;
            }

            // Reset tap tracking
            lastTapTime.current = 0;
          } else {
            lastTapTime.current = now;
            lastTapX.current = tapX;
            lastTapY.current = tapY;
          }
        }
      },

      onPanResponderTerminate: () => {
        lastScale.current = scale.value;
        lastTranslateX.current = translateX.value;
        lastTranslateY.current = translateY.value;
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar hidden={Platform.OS === 'android'} />
      <View className="flex-1 bg-black items-center justify-center">
        {/* Gesture area */}
        <View
          className="flex-1 w-full items-center justify-center"
          {...panResponder.panHandlers}
        >
          <Animated.View style={animatedStyle}>
            <Image
              source={{ uri: imageUri }}
              style={{ width: screenWidth, height: screenHeight }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Close button */}
        <TouchableOpacity
          onPress={handleClose}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 16,
          }}
          className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          accessibilityLabel="닫기"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={22} color={closeIconColor} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
