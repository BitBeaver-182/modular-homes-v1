import type { FileUploadResponse, PaginatedListResponse } from '../common';
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

export const SUPPLIER_ORDER_DETAIL_STATUSES = [
  'draft',
  'placed',
  'confirmed',
  'in_production',
  'ready_to_ship',
  'shipped',
  'arrived',
  'closed',
  'cancelled',
] as const;

export type SupplierOrderDetailStatus =
  (typeof SUPPLIER_ORDER_DETAIL_STATUSES)[number];

export const SUPPLIER_ORDER_INVOICE_STATUSES = [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'overdue',
  'disputed',
  'cancelled',
  'void',
] as const;

export type SupplierOrderInvoiceStatus =
  (typeof SUPPLIER_ORDER_INVOICE_STATUSES)[number];

export const SUPPLIER_ORDER_INVOICE_DIRECTIONS = [
  'payable',
  'receivable',
] as const;

export type SupplierOrderInvoiceDirection =
  (typeof SUPPLIER_ORDER_INVOICE_DIRECTIONS)[number];

export const SUPPLIER_ORDER_INVOICE_TYPES = [
  'supplier_goods',
  'customer_sale',
  'logistics',
  'customs',
  'storage',
  'delay_fee',
  'insurance',
  'tax',
  'credit_note',
  'other',
] as const;

export type SupplierOrderInvoiceType =
  (typeof SUPPLIER_ORDER_INVOICE_TYPES)[number];

export const SUPPLIER_ORDER_INVOICE_INSTALLMENT_STATUSES = [
  'scheduled',
  'due',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
] as const;

export type SupplierOrderInvoiceInstallmentStatus =
  (typeof SUPPLIER_ORDER_INVOICE_INSTALLMENT_STATUSES)[number];

export const SUPPLIER_ORDER_INVOICE_PAYMENT_METHODS = [
  'bank_transfer',
  'cash',
  'card',
  'online',
  'other',
] as const;

export type SupplierOrderInvoicePaymentMethod =
  (typeof SUPPLIER_ORDER_INVOICE_PAYMENT_METHODS)[number];

export const SUPPLIER_ORDER_INVOICE_PAYMENT_STATUSES = [
  'pending',
  'completed',
  'failed',
  'reversed',
  'refunded',
] as const;

export type SupplierOrderInvoicePaymentStatus =
  (typeof SUPPLIER_ORDER_INVOICE_PAYMENT_STATUSES)[number];

export interface SupplierOrderMoney {
  amount: number;
  currencyCode: string;
}

export interface SupplierOrderListMoney extends SupplierOrderMoney {}

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
  orderNumber: string | null;
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

export interface SupplierOrderLineWriteInput {
  id?: string;
  supplierQuoteLineId?: string | null;
  houseModelId?: string | null;
  productConfigurationId?: string | null;
  description?: string | null;
  quantity: number;
  unitCost: number;
}

export interface CreateSupplierOrderInvoiceRequest {
  attachmentId?: string | null;
  invoiceNumber: string;
  invoiceType: SupplierOrderInvoiceType;
  status: SupplierOrderInvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotalAmount: number;
  taxAmount: number;
  notes?: string | null;
}

export interface UpdateSupplierOrderInvoiceRequest {
  attachmentId?: string | null;
  invoiceNumber: string;
  invoiceType: SupplierOrderInvoiceType;
  status: SupplierOrderInvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotalAmount: number;
  taxAmount: number;
  notes?: string | null;
}

export interface CreateSupplierOrderInvoiceInstallmentRequest {
  dueDate: string;
  amountDue: number;
  notes?: string | null;
}

export interface UpdateSupplierOrderInvoiceInstallmentRequest {
  dueDate: string;
  amountDue: number;
  notes?: string | null;
}

export interface CreateSupplierOrderInvoicePaymentRequest {
  paymentReference?: string | null;
  paymentMethod: SupplierOrderInvoicePaymentMethod;
  paymentDate: string;
  amount: number;
  bankAccount?: string | null;
  transactionId?: string | null;
  notes?: string | null;
  invoiceInstallmentId?: string | null;
}

export interface UpdateSupplierOrderInvoicePaymentRequest {
  paymentReference?: string | null;
  paymentMethod: SupplierOrderInvoicePaymentMethod;
  paymentDate: string;
  amount: number;
  bankAccount?: string | null;
  transactionId?: string | null;
  notes?: string | null;
  invoiceInstallmentId?: string | null;
}

export interface UpdateSupplierOrderRequest {
  /**
   * Full replacement semantics for order lines.
   * - `undefined`: leave existing lines untouched
   * - `[]`: clear all existing lines
   */
  orderLines?: SupplierOrderLineWriteInput[];
}

export type SupplierOrderListResponse =
  PaginatedListResponse<SupplierOrderListItemResponse>;

export interface SupplierOrderDetailQuoteResponse {
  id: string;
  supplier: SupplierResponse | null;
  total: SupplierOrderMoney | null;
  quoteNumber: string | null;
  quoteDate: string | null;
  validUntil: string | null;
  paymentTerms: string | null;
}

export interface SupplierOrderDetailLineResponse {
  id: string;
  supplierQuoteLineId: string | null;
  houseModelId: string | null;
  productConfigurationId: string | null;
  description: string | null;
  quantity: number;
  unitCost: SupplierOrderMoney;
  lineTotal: SupplierOrderMoney;
  createdAt: string;
}

export interface SupplierOrderDetailInvoiceResponse {
  id: string;
  attachment: FileUploadResponse | null;
  invoiceNumber: string;
  direction: SupplierOrderInvoiceDirection;
  invoiceType: SupplierOrderInvoiceType;
  status: SupplierOrderInvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  currencyCode: string;
  subtotalAmount: SupplierOrderMoney;
  taxAmount: SupplierOrderMoney;
  totalAmount: SupplierOrderMoney;
  amountPaid: SupplierOrderMoney;
  balanceDue: SupplierOrderMoney;
  installments: SupplierOrderInvoiceInstallmentResponse[];
  payments: SupplierOrderInvoicePaymentResponse[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderInvoiceInstallmentResponse {
  id: string;
  installmentNumber: number;
  status: SupplierOrderInvoiceInstallmentStatus;
  dueDate: string;
  amountDue: SupplierOrderMoney;
  amountPaid: SupplierOrderMoney;
  balanceDue: SupplierOrderMoney;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderInvoicePaymentResponse {
  id: string;
  paymentReference: string | null;
  status: SupplierOrderInvoicePaymentStatus;
  paymentMethod: SupplierOrderInvoicePaymentMethod;
  paymentDate: string | null;
  amount: SupplierOrderMoney;
  bankAccount: string | null;
  transactionId: string | null;
  notes: string | null;
  invoiceInstallmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderDetailResponse {
  id: string;
  orderNumber: string | null;
  supplierPoNumber: string | null;
  status: SupplierOrderDetailStatus;
  orderDate: string | null;
  confirmedAt: string | null;
  expectedReadyDate: string | null;
  expectedShipDate: string | null;
  expectedArrivalDate: string | null;
  currencyCode: string;
  subtotalAmount: SupplierOrderMoney;
  shippingAmount: SupplierOrderMoney;
  taxAmount: SupplierOrderMoney;
  totalAmount: SupplierOrderMoney;
  incoterm: string | null;
  paymentTerms: string | null;
  loadingPort: string | null;
  destinationPort: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: SupplierResponse | null;
  quote: SupplierOrderDetailQuoteResponse | null;
  orderLines: SupplierOrderDetailLineResponse[];
  invoices: SupplierOrderDetailInvoiceResponse[];
}
