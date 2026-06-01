import type {
  ApiId,
  FileUploadResponse,
  IsoDateString,
  PaginatedListResponse,
} from '../common';
import type { SupplierResponse } from '../suppliers';

export const SUPPLIER_QUOTE_WRITABLE_STATUSES = [
  'received',
  'accepted',
  'rejected',
] as const;

export const SUPPLIER_QUOTE_STATUSES = SUPPLIER_QUOTE_WRITABLE_STATUSES;

export type SupplierQuoteWritableStatus =
  (typeof SUPPLIER_QUOTE_WRITABLE_STATUSES)[number];
export type SupplierQuoteStatus = (typeof SUPPLIER_QUOTE_STATUSES)[number];

export interface SupplierQuoteLineRequest {
  id?: ApiId;
  houseModelId?: ApiId | null;
  productConfigurationId?: ApiId | null;
  description?: string | null;
  quantity: number;
  unitCost: number;
  estimatedProductionDays?: number | null;
  notes?: string | null;
}

export interface SupplierQuoteLineResponse {
  id: ApiId;
  houseModelId: ApiId | null;
  productConfigurationId: ApiId | null;
  description: string | null;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  estimatedProductionDays: number | null;
  notes: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface SupplierQuoteOrderRef {
  id: ApiId;
  orderNumber: string | null;
}

export interface CreateSupplierQuoteRequest {
  supplierId: ApiId;
  attachmentId?: ApiId | null;
  quoteNumber?: string | null;
  status?: SupplierQuoteWritableStatus;
  quoteDate?: string | null;
  validUntil?: string | null;
  currencyCode?: string;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  paymentTerms?: string | null;
  notes?: string | null;
  lines?: SupplierQuoteLineRequest[];
}

export interface UpdateSupplierQuoteRequest {
  supplierId?: ApiId;
  attachmentId?: ApiId | null;
  quoteNumber?: string | null;
  status?: SupplierQuoteWritableStatus;
  quoteDate?: string | null;
  validUntil?: string | null;
  currencyCode?: string;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  paymentTerms?: string | null;
  notes?: string | null;
  lines?: SupplierQuoteLineRequest[];
}

export interface SupplierQuoteResponse {
  id: ApiId;
  supplier: SupplierResponse;
  supplierOrder: SupplierQuoteOrderRef | null;
  attachment: FileUploadResponse | null;
  quoteNumber: string | null;
  status: SupplierQuoteStatus;
  isExpired: boolean;
  quoteDate: string | null;
  validUntil: string | null;
  currencyCode: string;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: string | null;
  notes: string | null;
  statusUpdatedAt: IsoDateString | null;
  statusUpdatedByUserId: ApiId | null;
  lines: SupplierQuoteLineResponse[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export type SupplierQuoteListResponse =
  PaginatedListResponse<SupplierQuoteResponse>;
