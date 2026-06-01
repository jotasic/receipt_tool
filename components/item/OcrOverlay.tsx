/**
 * OCR 바운딩 박스 오버레이 컴포넌트
 *
 * ML Kit에서 반환한 텍스트 인식 영역을 이미지 위에 표시하고,
 * 사용자가 탭하여 해당 텍스트를 상호명/금액/날짜로 선택할 수 있습니다.
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { OcrBlock, OcrLine } from '@/services/ocr/types';
import { shouldShowOcrLine } from '@/services/ocr/filters';
import { colors } from '@/design-system/tokens/colors';

export type SelectionMode = 'storeName' | 'amount' | 'date';

export interface SelectedItem {
  text: string;
  mode: SelectionMode;
  lineIndex: string; // "blockIndex-lineIndex" 형태
}

interface OcrOverlayProps {
  /** 원본 이미지 URI */
  imageUri: string;
  /** OCR 결과 블록 */
  blocks: OcrBlock[];
  /** 이미지 원본 크기 */
  imageSize: { width: number; height: number };
  /** 선택된 항목들 */
  selectedItems: SelectedItem[];
  /** 선택 콜백 */
  onSelectItem: (item: SelectedItem) => void;
  /** 선택 해제 콜백 */
  onDeselectItem: (lineIndex: string) => void;
  /** 활성 선택 모드 (없으면 탭 시 모달 표시) */
  activeMode?: SelectionMode;
}

const MODE_CONFIG = {
  storeName: {
    label: '상호명',
    color: colors.primary,
    icon: 'business' as const,
  },
  amount: {
    label: '금액',
    color: colors.success,
    icon: 'cash' as const,
  },
  date: {
    label: '날짜',
    color: colors.warning,
    icon: 'calendar' as const,
  },
};

export function OcrOverlay({
  imageUri,
  blocks,
  imageSize,
  selectedItems,
  onSelectItem,
  onDeselectItem,
  activeMode,
}: OcrOverlayProps) {
  const insets = useSafeAreaInsets();
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [tappedLine, setTappedLine] = useState<{ text: string; lineIndex: string } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // 이미지 레이아웃 계산
  const handleImageLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDisplaySize({ width, height });
  };

  // OCR 좌표에서 실제 이미지 크기 추정 (EXIF 회전 감지용)
  const ocrBounds = useMemo(() => {
    let maxRight = 0;
    let maxBottom = 0;

    blocks.forEach(block => {
      block.lines.forEach(line => {
        if (line.frame) {
          maxRight = Math.max(maxRight, line.frame.left + line.frame.width);
          maxBottom = Math.max(maxBottom, line.frame.top + line.frame.height);
        }
      });
    });

    return { maxRight, maxBottom };
  }, [blocks]);

  // OCR 좌표 기준 실제 이미지 크기 계산
  const correctedImageSize = useMemo(() => {
    const { maxRight, maxBottom } = ocrBounds;
    if (maxRight === 0 || maxBottom === 0) return imageSize;

    const exceedsWidth = maxRight > imageSize.width * 1.1;
    const exceedsHeight = maxBottom > imageSize.height * 1.1;

    if (exceedsWidth || exceedsHeight) {
      const swappedMatchesWidth = maxRight <= imageSize.height * 1.1;
      const swappedMatchesHeight = maxBottom <= imageSize.width * 1.1;

      if (swappedMatchesWidth && swappedMatchesHeight) {
        return { width: imageSize.height, height: imageSize.width };
      }

      return {
        width: maxRight * 1.05,
        height: maxBottom * 1.05,
      };
    }

    return imageSize;
  }, [imageSize, ocrBounds]);

  // 실제 렌더링된 이미지 크기 및 위치 계산
  const imageLayout = useMemo(() => {
    if (!correctedImageSize.width || !correctedImageSize.height || !displaySize.width || !displaySize.height) {
      return { scale: 1, offsetX: 0, offsetY: 0, renderedWidth: 0, renderedHeight: 0 };
    }

    const imageAspect = correctedImageSize.width / correctedImageSize.height;
    const containerAspect = displaySize.width / displaySize.height;

    let renderedWidth: number;
    let renderedHeight: number;
    let scale: number;

    if (imageAspect > containerAspect) {
      renderedWidth = displaySize.width;
      scale = displaySize.width / correctedImageSize.width;
      renderedHeight = correctedImageSize.height * scale;
    } else {
      renderedHeight = displaySize.height;
      scale = displaySize.height / correctedImageSize.height;
      renderedWidth = correctedImageSize.width * scale;
    }

    const offsetX = (displaySize.width - renderedWidth) / 2;
    const offsetY = (displaySize.height - renderedHeight) / 2;

    return { scale, offsetX, offsetY, renderedWidth, renderedHeight };
  }, [correctedImageSize, displaySize]);

  // line index로 선택된 항목 찾기
  const findSelectedItem = (lineIndex: string): SelectedItem | undefined => {
    return selectedItems.find(item => item.lineIndex === lineIndex);
  };

  // line 탭 핸들러
  const handleLineTap = (text: string, lineIndex: string) => {
    const alreadySelected = findSelectedItem(lineIndex);

    if (alreadySelected) {
      onDeselectItem(lineIndex);
      return;
    }

    if (activeMode) {
      onSelectItem({ text, mode: activeMode, lineIndex });
    } else {
      setTappedLine({ text, lineIndex });
      setModalVisible(true);
    }
  };

  // 모달에서 모드 선택
  const handleModeSelect = (mode: SelectionMode) => {
    if (tappedLine) {
      onSelectItem({ text: tappedLine.text, mode, lineIndex: tappedLine.lineIndex });
      setModalVisible(false);
      setTappedLine(null);
    }
  };

  // 모든 라인 추출 (블록 → 라인)
  const allLines = useMemo(() => {
    const lines: { line: OcrLine; blockIndex: number; lineIndexInBlock: number; lineIndex: string }[] = [];
    blocks.forEach((block, blockIndex) => {
      block.lines.forEach((line, lineIndexInBlock) => {
        lines.push({
          line,
          blockIndex,
          lineIndexInBlock,
          lineIndex: `${blockIndex}-${lineIndexInBlock}`,
        });
      });
    });
    return lines;
  }, [blocks]);

  return (
    <View
      className="flex-1"
      onLayout={handleImageLayout}
    >
      {/* 이미지 컨테이너 */}
      <Image
        source={{ uri: imageUri }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="contain"
      />

      {/* 바운딩 박스 오버레이 */}
      {displaySize.width > 0 && displaySize.height > 0 && (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="box-none"
        >
          {/* 디버그: 이미지 렌더링 영역 표시 */}
          {showDebug && (
            <View
              style={{
                position: 'absolute',
                left: imageLayout.offsetX,
                top: imageLayout.offsetY,
                width: imageLayout.renderedWidth,
                height: imageLayout.renderedHeight,
                borderWidth: 3,
                borderColor: 'red',
                borderStyle: 'dashed',
              }}
              pointerEvents="none"
            />
          )}

          {allLines.map(({ line, lineIndex }) => {
            if (!line.frame) return null;
            if (!shouldShowOcrLine(line)) return null;

            const selectedItem = findSelectedItem(lineIndex);
            const isSelected = !!selectedItem;
            const config = selectedItem ? MODE_CONFIG[selectedItem.mode] : null;

            const { scale, offsetX, offsetY } = imageLayout;
            const left = line.frame.left * scale + offsetX;
            const top = line.frame.top * scale + offsetY;
            const width = line.frame.width * scale;
            const height = line.frame.height * scale;

            return (
              <TouchableOpacity
                key={lineIndex}
                activeOpacity={0.7}
                onPress={() => handleLineTap(line.text, lineIndex)}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  borderWidth: 2,
                  borderColor: isSelected ? config?.color : 'rgba(59, 130, 246, 0.5)',
                  backgroundColor: isSelected
                    ? `${config?.color}33`
                    : 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 4,
                }}
              >
                {isSelected && config && (
                  <View
                    className="absolute -top-6 left-0 px-2 py-1 rounded"
                    style={{ backgroundColor: config.color }}
                  >
                    <Text className="text-white text-xs font-semibold">
                      {config.label}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* 디버그 토글 버튼 */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              backgroundColor: showDebug ? 'rgba(220, 38, 38, 0.8)' : 'rgba(0, 0, 0, 0.5)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
            onPress={() => setShowDebug(!showDebug)}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>
              {showDebug ? '디버그 끄기' : '디버그'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 선택 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            className="bg-white dark:bg-gray-800 rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-6" style={{ paddingBottom: insets.bottom + 24 }}>
              {/* 헤더 */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  항목 선택
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="w-8 h-8 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color={colors.secondary} />
                </TouchableOpacity>
              </View>

              {/* 선택된 텍스트 */}
              {tappedLine && (
                <View className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-4">
                  <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">선택한 텍스트</Text>
                  <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {tappedLine.text}
                  </Text>
                </View>
              )}

              {/* 모드 선택 버튼 */}
              <View className="gap-3">
                {(Object.entries(MODE_CONFIG) as [SelectionMode, typeof MODE_CONFIG[SelectionMode]][]).map(
                  ([mode, config]) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => handleModeSelect(mode)}
                      className="flex-row items-center p-4 border-2 rounded-xl"
                      style={{ borderColor: config.color }}
                      activeOpacity={0.7}
                    >
                      <View
                        className="w-12 h-12 items-center justify-center rounded-full mr-4"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Ionicons name={config.icon} size={24} color={config.color} />
                      </View>
                      <Text className="text-lg font-semibold" style={{ color: config.color }}>
                        {config.label}로 설정
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
