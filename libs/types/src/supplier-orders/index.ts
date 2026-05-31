import type { PaginatedListResponse } from '../common';
import type { SupplierResponse } from '../suppliers';

export const SUPPLIER_ORDER_LIST_STATUSES = [
  'draft',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type SupplierOrderListStatus =
  (typeof SUPPLIER_ORDER_LIST_STATUSES)[number];

export interface SupplierOrderListMoney {
  amount: number;
  currencyCode: string;
}

export interface SupplierOrderListQuoteResponse {
  id: string;
  supplier: SupplierResponse | null;
  total: SupplierOrderListMoney | null;
}

export interface SupplierOrderListInvoiceResponse {
  id: string;
  total: SupplierOrderListMoney | null;
  amountPaid: SupplierOrderListMoney | null;
  balanceDue: SupplierOrderListMoney | null;
}

export interface SupplierOrderListItemResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderStatus: SupplierOrderListStatus;
  supplier: SupplierResponse | null;
  quote: SupplierOrderListQuoteResponse | null;
  invoices: SupplierOrderListInvoiceResponse[];
}

export interface CreateSupplierOrderRequest {
  quoteId: string;
}

export type SupplierOrderListResponse =
  PaginatedListResponse<SupplierOrderListItemResponse>;
