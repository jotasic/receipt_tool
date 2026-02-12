export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type ReceiptType = 'corporate' | 'personal';

export interface Receipt {
  id: string;
  title: string;
  storeName: string;
  amount: number;
  date: string;
  category: string;
  imagePath?: string;
  ocrText?: string;
  receiptType: ReceiptType;
  memo?: string;
  items?: ReceiptItem[];
  createdAt: string;
  updatedAt: string;
}
