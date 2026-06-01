import type {
  SupplierOrderDetailInvoiceResponse,
  SupplierOrderDetailLineResponse,
  SupplierOrderDetailResponse,
  SupplierOrderListInvoiceResponse,
  SupplierOrderListItemResponse,
  SupplierOrderListMoney,
  SupplierOrderListResponse,
  SupplierOrderListStatus,
} from '@moduflow/types';
import type { Prisma } from '@prisma/client';
import {
  decimalToNumber,
  toOptionalIsoDateString,
  toApiId,
  toIsoDateString,
} from '../../../common/mappers/transport';
import { toSupplierResponse } from '../../suppliers/mappers/supplier.mapper';

export type SupplierOrderWithRelations = Prisma.SupplierOrderGetPayload<{
  include: {
    supplier: { include: { address: true } };
    supplierQuote: {
      include: {
        supplier: { include: { address: true } };
      };
    };
    lines: {
      orderBy: { id: 'asc' };
    };
    invoices: {
      orderBy: { id: 'asc' };
    };
  };
}>;
export type SupplierOrderInvoiceRecord = Prisma.InvoiceGetPayload<{}>;

type SupplierOrderListMeta = SupplierOrderListResponse['meta'];
type SupplierOrderDetailMoney = SupplierOrderDetailResponse['totalAmount'];

function toMoney(
  amount: Prisma.Decimal | null | undefined,
  currencyCode: string | null | undefined,
): SupplierOrderListMoney | null {
  if (amount === null || amount === undefined || !currencyCode) {
    return null;
  }

  return {
    amount: decimalToNumber(amount),
    currencyCode,
  };
}

function toRequiredMoney(
  amount: Prisma.Decimal | null | undefined,
  currencyCode: string | null | undefined,
): SupplierOrderDetailMoney {
  return {
    amount: decimalToNumber(amount ?? 0),
    currencyCode: currencyCode ?? 'EUR',
  };
}

function toNullableIsoDateString(
  value: Date | null | undefined,
): string | null {
  return toOptionalIsoDateString(value) ?? null;
}

function toOrderStatus(
  status: SupplierOrderWithRelations['status'],
): SupplierOrderListStatus {
  if (status === 'draft') {
    return 'draft';
  }
  if (status === 'shipped') {
    return 'shipped';
  }
  if (status === 'arrived' || status === 'closed') {
    return 'delivered';
  }
  if (status === 'cancelled') {
    return 'cancelled';
  }

  return 'processing';
}

function toInvoiceResponse(
  invoice: SupplierOrderWithRelations['invoices'][number],
): SupplierOrderListInvoiceResponse {
  return {
    id: toApiId(invoice.id),
    total: toMoney(invoice.totalAmount, invoice.currencyCode),
    amountPaid: toMoney(invoice.amountPaid, invoice.currencyCode),
    balanceDue: toMoney(invoice.balanceDue, invoice.currencyCode),
  };
}

export function toSupplierOrderListItemResponse(
  order: SupplierOrderWithRelations,
): SupplierOrderListItemResponse {
  return {
    id: toApiId(order.id),
    orderNumber: order.orderNumber,
    createdAt: toIsoDateString(order.createdAt),
    updatedAt: toIsoDateString(order.updatedAt),
    orderStatus: toOrderStatus(order.status),
    supplier: order.supplier ? toSupplierResponse(order.supplier) : null,
    quote: order.supplierQuote
      ? {
          id: toApiId(order.supplierQuote.id),
          supplier: order.supplierQuote.supplier
            ? toSupplierResponse(order.supplierQuote.supplier)
            : null,
          total: toMoney(
            order.supplierQuote.totalAmount,
            order.supplierQuote.currencyCode,
          ),
        }
      : null,
    invoices: order.invoices.map(toInvoiceResponse),
  };
}

export function toSupplierOrderListResponse(
  orders: SupplierOrderWithRelations[],
  meta: SupplierOrderListMeta,
): SupplierOrderListResponse {
  return {
    data: orders.map(toSupplierOrderListItemResponse),
    meta,
  };
}

function toSupplierOrderDetailLineResponse(
  line: SupplierOrderWithRelations['lines'][number],
  currencyCode: string,
): SupplierOrderDetailLineResponse {
  return {
    id: toApiId(line.id),
    supplierQuoteLineId: line.supplierQuoteLineId
      ? toApiId(line.supplierQuoteLineId)
      : null,
    houseModelId: line.houseModelId ? toApiId(line.houseModelId) : null,
    productConfigurationId: line.productConfigurationId
      ? toApiId(line.productConfigurationId)
      : null,
    description: line.description ?? null,
    quantity: line.quantity,
    unitCost: toRequiredMoney(line.unitCost, currencyCode),
    lineTotal: toRequiredMoney(line.lineTotal, currencyCode),
    createdAt: toIsoDateString(line.createdAt),
  };
}

export function toSupplierOrderDetailInvoiceResponse(
  invoice: SupplierOrderWithRelations['invoices'][number] | SupplierOrderInvoiceRecord,
): SupplierOrderDetailInvoiceResponse {
  return {
    id: toApiId(invoice.id),
    invoiceNumber: invoice.invoiceNumber,
    direction: invoice.direction,
    invoiceType: invoice.invoiceType,
    status: invoice.status,
    issueDate: toNullableIsoDateString(invoice.issueDate),
    dueDate: toNullableIsoDateString(invoice.dueDate),
    currencyCode: invoice.currencyCode,
    subtotalAmount: toRequiredMoney(
      invoice.subtotalAmount,
      invoice.currencyCode,
    ),
    taxAmount: toRequiredMoney(invoice.taxAmount, invoice.currencyCode),
    totalAmount: toRequiredMoney(invoice.totalAmount, invoice.currencyCode),
    amountPaid: toRequiredMoney(invoice.amountPaid, invoice.currencyCode),
    balanceDue: toRequiredMoney(invoice.balanceDue, invoice.currencyCode),
    notes: invoice.notes ?? null,
    createdAt: toIsoDateString(invoice.createdAt),
    updatedAt: toIsoDateString(invoice.updatedAt),
  };
}

export function toSupplierOrderDetailResponse(
  order: SupplierOrderWithRelations,
): SupplierOrderDetailResponse {
  return {
    id: toApiId(order.id),
    orderNumber: order.orderNumber,
    supplierPoNumber: order.supplierPoNumber,
    status: order.status,
    orderDate: toNullableIsoDateString(order.orderDate),
    confirmedAt: toNullableIsoDateString(order.confirmedAt),
    expectedReadyDate: toNullableIsoDateString(order.expectedReadyDate),
    expectedShipDate: toNullableIsoDateString(order.expectedShipDate),
    expectedArrivalDate: toNullableIsoDateString(order.expectedArrivalDate),
    currencyCode: order.currencyCode,
    subtotalAmount: toRequiredMoney(order.subtotalAmount, order.currencyCode),
    shippingAmount: toRequiredMoney(order.shippingAmount, order.currencyCode),
    taxAmount: toRequiredMoney(order.taxAmount, order.currencyCode),
    totalAmount: toRequiredMoney(order.totalAmount, order.currencyCode),
    incoterm: order.incoterm ?? null,
    paymentTerms: order.paymentTerms ?? null,
    loadingPort: order.loadingPort ?? null,
    destinationPort: order.destinationPort ?? null,
    notes: order.notes ?? null,
    createdAt: toIsoDateString(order.createdAt),
    updatedAt: toIsoDateString(order.updatedAt),
    supplier: order.supplier ? toSupplierResponse(order.supplier) : null,
    quote: order.supplierQuote
      ? {
          id: toApiId(order.supplierQuote.id),
          supplier: order.supplierQuote.supplier
            ? toSupplierResponse(order.supplierQuote.supplier)
            : null,
          total: toMoney(
            order.supplierQuote.totalAmount,
            order.supplierQuote.currencyCode,
          ),
          quoteNumber: order.supplierQuote.quoteNumber,
          quoteDate: toNullableIsoDateString(order.supplierQuote.quoteDate),
          validUntil: toNullableIsoDateString(order.supplierQuote.validUntil),
          paymentTerms: order.supplierQuote.paymentTerms ?? null,
        }
      : null,
    orderLines: order.lines.map((line) =>
      toSupplierOrderDetailLineResponse(line, order.currencyCode),
    ),
    invoices: order.invoices.map(toSupplierOrderDetailInvoiceResponse),
  };
}
