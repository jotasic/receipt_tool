/**
 * Backup and Restore Types
 */

import type { Item } from './item';
import type { Tag } from './tag';
import type { Report } from './report';
import type { CustomField } from './customField';
import type { UsagePurpose } from './usagePurpose';

/**
 * Database row types for backup
 */
export interface ItemTagRow {
  item_id: string;
  tag_id: string;
}

export interface ItemCustomValueRow {
  item_id: string;
  field_id: string;
  value: string | null;
}

export interface ReportItemRow {
  report_id: string;
  item_id: string;
  item_order: number;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  tables: {
    items: Item[];
    tags: Tag[];
    item_tags: ItemTagRow[];
    usage_purposes: UsagePurpose[];
    custom_fields: CustomField[];
    item_custom_values: ItemCustomValueRow[];
    reports: Report[];
    report_items: ReportItemRow[];
  };
}

export interface BackupStats {
  items: number;
  tags: number;
  reports: number;
  customFields: number;
  usagePurposes: number;
}
