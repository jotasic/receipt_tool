/**
 * SegmentedControl Component
 *
 * iOS-style segmented control for switching between view modes.
 * Supports dark mode and smooth animations.
 */

import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRef, useEffect, useState } from 'react';

interface SegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function SegmentedControl({ values, selectedIndex, onChange }: SegmentedControlProps) {
  const slideAnim = useRef(new Animated.Value(selectedIndex)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedIndex,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [selectedIndex, slideAnim]);

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setSegmentWidth(width / values.length);
  };

  const translateX = slideAnim.interpolate({
    inputRange: values.map((_, i) => i),
    outputRange: values.map((_, i) => i * segmentWidth),
  });

  return (
    <View
      className="flex-row h-8 rounded-lg p-0.5 bg-gray-200 dark:bg-gray-700"
      style={{ minWidth: values.length * 50 }}
      onLayout={handleLayout}
    >
      {/* Animated Background Slider */}
      <Animated.View
        className="absolute h-7 rounded-md bg-white dark:bg-gray-600 m-0.5"
        style={{
          width: segmentWidth - 4, // Subtract padding (0.5 * 2 * 2px)
          transform: [{ translateX }],
        }}
      />

      {/* Segment Buttons */}
      {values.map((value, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={value}
            onPress={() => onChange(index)}
            className="flex-1 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-semibold ${
                isSelected
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {value}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
