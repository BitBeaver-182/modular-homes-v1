import type {
  SupplierOrderListInvoiceResponse,
  SupplierOrderListItemResponse,
  SupplierOrderListMoney,
  SupplierOrderListResponse,
  SupplierOrderListStatus,
} from '@moduflow/types';
import type { Prisma } from '@prisma/client';
import {
  decimalToNumber,
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
    invoices: {
      orderBy: { id: 'asc' };
    };
  };
}>;

type SupplierOrderListMeta = SupplierOrderListResponse['meta'];

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
