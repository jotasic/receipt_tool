/**
 * Category Type Definition
 *
 * @deprecated Legacy category system, replaced by UsagePurpose
 * Kept for backward compatibility with old receipt data only.
 *
 * For new implementations, use UsagePurpose type instead.
 */

/**
 * @deprecated Use UsagePurpose instead
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
