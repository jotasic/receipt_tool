/**
 * OCR Text Box Filters
 *
 * Configurable filters for removing irrelevant OCR bounding boxes.
 * Adjust constants to tune filtering behavior.
 */

import type { OcrLine } from './types';

// ============================================================
// Filter Constants (adjust to tune behavior)
// ============================================================

/** Aspect ratio threshold: height/width > this = vertical text */
export const VERTICAL_TEXT_RATIO = 2.0;

/** Minimum box width in pixels (OCR coordinate space) */
export const MIN_BOX_WIDTH = 20;

/** Minimum box height in pixels (OCR coordinate space) */
export const MIN_BOX_HEIGHT = 10;

/** Minimum text character count to show as a box */
export const MIN_TEXT_LENGTH = 2;

// ============================================================
// Individual Filter Functions
// ============================================================

/** Returns true if the line should be KEPT (false = filtered out) */

export function isNotVerticalText(line: OcrLine): boolean {
  if (!line.frame) return true;
  const ratio = line.frame.height / line.frame.width;
  return ratio <= VERTICAL_TEXT_RATIO;
}

export function isNotTooSmall(line: OcrLine): boolean {
  if (!line.frame) return true;
  return line.frame.width >= MIN_BOX_WIDTH && line.frame.height >= MIN_BOX_HEIGHT;
}

export function isNotSingleChar(line: OcrLine): boolean {
  return line.text.trim().length >= MIN_TEXT_LENGTH;
}

// ============================================================
// Combined Filter
// ============================================================

/**
 * Apply all filters to determine if a line should be shown.
 * Returns true if the line should be KEPT.
 *
 * To add new filters in the future, add them to this array.
 */
const ACTIVE_FILTERS: ((line: OcrLine) => boolean)[] = [
  isNotVerticalText,
  isNotTooSmall,
  isNotSingleChar,
];

export function shouldShowOcrLine(line: OcrLine): boolean {
  return ACTIVE_FILTERS.every(filter => filter(line));
}
