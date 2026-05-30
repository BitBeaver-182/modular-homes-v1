import type {
  ApiId,
  FileUploadResponse,
  IsoDateString,
  PaginationMeta,
} from '../common';
import type { SupplierResponse } from '../suppliers';

export const SUPPLIER_QUOTE_STATUSES = [
  'received',
  'accepted',
  'rejected',
  'expired',
] as const;

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

export interface CreateSupplierQuoteRequest {
  supplierId: ApiId;
  attachmentId?: ApiId | null;
  quoteNumber?: string | null;
  status?: SupplierQuoteStatus;
  quoteDate?: string | null;
  validUntil?: string | null;
  currencyCode?: string;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  incoterm?: string | null;
  paymentTerms?: string | null;
  loadingPort?: string | null;
  destinationPort?: string | null;
  notes?: string | null;
  lines?: SupplierQuoteLineRequest[];
}

export interface UpdateSupplierQuoteRequest {
  supplierId?: ApiId;
  attachmentId?: ApiId | null;
  quoteNumber?: string | null;
  status?: SupplierQuoteStatus;
  quoteDate?: string | null;
  validUntil?: string | null;
  currencyCode?: string;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  incoterm?: string | null;
  paymentTerms?: string | null;
  loadingPort?: string | null;
  destinationPort?: string | null;
  notes?: string | null;
  lines?: SupplierQuoteLineRequest[];
}

export interface SupplierQuoteResponse {
  id: ApiId;
  supplier: SupplierResponse;
  attachment: FileUploadResponse | null;
  quoteNumber: string | null;
  status: SupplierQuoteStatus;
  quoteDate: string | null;
  validUntil: string | null;
  currencyCode: string;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  incoterm: string | null;
  paymentTerms: string | null;
  loadingPort: string | null;
  destinationPort: string | null;
  notes: string | null;
  acceptedAt: IsoDateString | null;
  rejectedAt: IsoDateString | null;
  acceptedByUserId: ApiId | null;
  lines: SupplierQuoteLineResponse[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface SupplierQuoteListMetaResponse {
  pagination: PaginationMeta;
}

export interface SupplierQuoteListResponse {
  data: SupplierQuoteResponse[];
  meta: SupplierQuoteListMetaResponse;
}
