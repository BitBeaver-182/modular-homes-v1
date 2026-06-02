import type {
  SupplierOrderDetailInvoiceResponse,
  SupplierOrderInvoiceInstallmentResponse,
  SupplierOrderInvoicePaymentResponse,
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
import { FileUploadMapper } from '../../../uploads/mappers/file-upload.mapper';
import type { IStorageService } from '../../../storage/storage.service.interface';
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
      include: {
        attachment: true;
        installments: {
          orderBy: { installmentNumber: 'asc' };
        };
        paymentAllocations: {
          orderBy: { createdAt: 'asc' };
          include: { payment: true };
        };
      };
    };
  };
}>;
export type SupplierOrderInvoiceRecord = Prisma.InvoiceGetPayload<{
  include: {
    attachment: true;
    installments: {
      orderBy: { installmentNumber: 'asc' };
    };
    paymentAllocations: {
      orderBy: { createdAt: 'asc' };
      include: { payment: true };
    };
  };
}>;
export type SupplierOrderInvoiceInstallmentRecord = Prisma.InvoiceInstallmentGetPayload<{}>;
export type SupplierOrderInvoicePaymentRecord = Prisma.PaymentGetPayload<{}>;

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

export async function toSupplierOrderDetailInvoiceResponse(
  invoice:
    | SupplierOrderWithRelations['invoices'][number]
    | SupplierOrderInvoiceRecord,
  storageService: IStorageService,
): Promise<SupplierOrderDetailInvoiceResponse> {
  return {
    id: toApiId(invoice.id),
    attachment: invoice.attachment
      ? await FileUploadMapper.toResponse(invoice.attachment, storageService)
      : null,
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
    installments: invoice.installments.map((installment) =>
      toSupplierOrderInvoiceInstallmentResponse(installment, invoice.currencyCode),
    ),
    payments: invoice.paymentAllocations.map(({ payment, invoiceInstallmentId }) =>
      toSupplierOrderInvoicePaymentResponse(
        payment,
        invoice.currencyCode,
        invoiceInstallmentId,
      ),
    ),
    notes: invoice.notes ?? null,
    createdAt: toIsoDateString(invoice.createdAt),
    updatedAt: toIsoDateString(invoice.updatedAt),
  };
}

export function toSupplierOrderInvoiceInstallmentResponse(
  installment: SupplierOrderInvoiceInstallmentRecord,
  currencyCode: string,
): SupplierOrderInvoiceInstallmentResponse {
  return {
    id: toApiId(installment.id),
    installmentNumber: installment.installmentNumber,
    status: installment.status,
    dueDate: toIsoDateString(installment.dueDate),
    amountDue: toRequiredMoney(installment.amountDue, currencyCode),
    amountPaid: toRequiredMoney(installment.amountPaid, currencyCode),
    balanceDue: toRequiredMoney(
      installment.amountDue.sub(installment.amountPaid),
      currencyCode,
    ),
    paidAt: toNullableIsoDateString(installment.paidAt),
    notes: installment.notes ?? null,
    createdAt: toIsoDateString(installment.createdAt),
    updatedAt: toIsoDateString(installment.updatedAt),
  };
}

export function toSupplierOrderInvoicePaymentResponse(
  payment: SupplierOrderInvoicePaymentRecord,
  currencyCode: string,
  invoiceInstallmentId: bigint | null,
): SupplierOrderInvoicePaymentResponse {
  return {
    id: toApiId(payment.id),
    paymentReference: payment.paymentReference ?? null,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    paymentDate: toNullableIsoDateString(payment.paymentDate),
    amount: toRequiredMoney(payment.amount, currencyCode),
    bankAccount: payment.bankAccount ?? null,
    transactionId: payment.transactionId ?? null,
    notes: payment.notes ?? null,
    invoiceInstallmentId: invoiceInstallmentId
      ? toApiId(invoiceInstallmentId)
      : null,
    createdAt: toIsoDateString(payment.createdAt),
    updatedAt: toIsoDateString(payment.updatedAt),
  };
}

export async function toSupplierOrderDetailResponse(
  order: SupplierOrderWithRelations,
  storageService: IStorageService,
): Promise<SupplierOrderDetailResponse> {
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
    invoices: await Promise.all(
      order.invoices.map((invoice) =>
        toSupplierOrderDetailInvoiceResponse(invoice, storageService),
      ),
    ),
  };
}
