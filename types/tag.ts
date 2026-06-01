/**
 * Tag Type Definition
 *
 * Represents tags for categorizing receipts and documents
 */

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
  spaceId?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}
