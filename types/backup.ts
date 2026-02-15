/**
 * Backup and Restore Types
 */

export interface BackupData {
  version: string;
  exportedAt: string;
  tables: {
    items: any[];
    tags: any[];
    item_tags: any[];
    usage_purposes: any[];
    custom_fields: any[];
    item_custom_values: any[];
    reports: any[];
    report_items: any[];
  };
}

export interface BackupStats {
  items: number;
  tags: number;
  reports: number;
  customFields: number;
  usagePurposes: number;
}
