import type {
  SupplierQuoteLineResponse,
  SupplierQuoteListResponse,
  SupplierQuoteResponse,
} from '@moduflow/types';
import type { Prisma } from '@prisma/client';
import {
  decimalToNumber,
  toApiId,
  toDateOnlyString,
  toOptionalIsoDateString,
} from '../../../common/mappers/transport';
import { FileUploadMapper } from '../../../uploads/mappers/file-upload.mapper';
import type { IStorageService } from '../../../storage/storage.service.interface';
import { toSupplierResponse } from '../../suppliers/mappers/supplier.mapper';

export type SupplierQuoteWithRelations = Prisma.SupplierQuoteGetPayload<{
  include: {
    supplier: { include: { address: true } };
    attachment: true;
    lines: { orderBy: { id: 'asc' } };
    supplierOrders: {
      orderBy: { createdAt: 'desc' };
      take: 1;
    };
  };
}>;

function isSupplierQuoteExpired(
  quote: Pick<SupplierQuoteWithRelations, 'status' | 'validUntil'>,
): boolean {
  return Boolean(
    quote.status === 'received' &&
    quote.validUntil &&
    quote.validUntil < startOfUtcToday(),
  );
}

function toSupplierQuoteLineResponse(
  line: SupplierQuoteWithRelations['lines'][number],
): SupplierQuoteLineResponse {
  return {
    id: toApiId(line.id),
    houseModelId: line.houseModelId ? toApiId(line.houseModelId) : null,
    productConfigurationId: line.productConfigurationId
      ? toApiId(line.productConfigurationId)
      : null,
    description: line.description,
    quantity: line.quantity,
    unitCost: decimalToNumber(line.unitCost),
    lineTotal: decimalToNumber(line.lineTotal),
    estimatedProductionDays: line.estimatedProductionDays,
    notes: line.notes,
    createdAt: line.createdAt.toISOString(),
    updatedAt: line.updatedAt.toISOString(),
  };
}

export async function toSupplierQuoteResponse(
  quote: SupplierQuoteWithRelations,
  storageService: IStorageService,
): Promise<SupplierQuoteResponse> {
  return {
    id: toApiId(quote.id),
    supplier: toSupplierResponse(quote.supplier),
    supplierOrder: quote.supplierOrders[0]
      ? {
          id: toApiId(quote.supplierOrders[0].id),
          orderNumber: quote.supplierOrders[0].orderNumber,
        }
      : null,
    attachment: quote.attachment
      ? await FileUploadMapper.toResponse(quote.attachment, storageService)
      : null,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    isExpired: isSupplierQuoteExpired(quote),
    quoteDate: toDateOnlyString(quote.quoteDate),
    validUntil: toDateOnlyString(quote.validUntil),
    currencyCode: quote.currencyCode,
    subtotalAmount: decimalToNumber(quote.subtotalAmount),
    shippingAmount: decimalToNumber(quote.shippingAmount),
    taxAmount: decimalToNumber(quote.taxAmount),
    totalAmount: decimalToNumber(quote.totalAmount),
    paymentTerms: quote.paymentTerms,
    notes: quote.notes,
    statusUpdatedAt: toOptionalIsoDateString(quote.statusUpdatedAt) ?? null,
    statusUpdatedByUserId: quote.statusUpdatedByUserId
      ? toApiId(quote.statusUpdatedByUserId)
      : null,
    lines: quote.lines.map(toSupplierQuoteLineResponse),
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
  };
}

export async function toSupplierQuoteListResponse(
  quotes: SupplierQuoteWithRelations[],
  meta: SupplierQuoteListResponse['meta'],
  storageService: IStorageService,
): Promise<SupplierQuoteListResponse> {
  return {
    data: await Promise.all(
      quotes.map((quote) => toSupplierQuoteResponse(quote, storageService)),
    ),
    meta,
  };
}

function startOfUtcToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}
