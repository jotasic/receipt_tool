/**
 * Custom Field Type Definition
 *
 * Represents user-defined custom fields for receipts and documents
 */

export type CustomFieldType = 'text' | 'number' | 'date' | 'select';
export type CustomFieldEntityType = 'receipt' | 'document' | 'item' | 'both';

export interface CustomField {
  id: string;
  name: string;
  fieldType: CustomFieldType;
  options?: string[];  // For select type fields
  isRequired: boolean;
  entityType: CustomFieldEntityType;
  displayOrder: number;
  createdAt: string;
}

export interface CreateCustomFieldInput {
  name: string;
  fieldType: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  entityType: CustomFieldEntityType;
  displayOrder?: number;
}

export interface UpdateCustomFieldInput {
  name?: string;
  fieldType?: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  entityType?: CustomFieldEntityType;
  displayOrder?: number;
}

export interface CustomFieldValue {
  fieldId: string;
  value: string | null;
  fieldName?: string;
  fieldType?: CustomFieldType;
}
