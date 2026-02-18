/**
 * Custom Field Type Definition
 */

export type CustomFieldType = 'text' | 'number' | 'date' | 'select';
export type CustomFieldEntityType = 'item';

export interface CustomField {
  id: string;
  name: string;
  fieldType: CustomFieldType;
  options?: string[];
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
  entityType?: CustomFieldEntityType;
  displayOrder?: number;
}

export interface UpdateCustomFieldInput {
  name?: string;
  fieldType?: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  displayOrder?: number;
}

export interface CustomFieldValue {
  fieldId: string;
  value: string | null;
  fieldName?: string;
  fieldType?: CustomFieldType;
}
