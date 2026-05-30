import type {
  SupplierQuoteLineResponse,
  SupplierQuoteListResponse,
  SupplierQuoteResponse,
} from '@moduflow/types';
import type { Prisma } from '@prisma/client';
import { toApiId, toIsoDateString } from '../../../common/mappers/transport';
import { FileUploadMapper } from '../../../uploads/mappers/file-upload.mapper';
import type { IStorageService } from '../../../storage/storage.service.interface';
import { toSupplierResponse } from '../../suppliers/mappers/supplier.mapper';

export type SupplierQuoteWithRelations = Prisma.SupplierQuoteGetPayload<{
  include: {
    supplier: { include: { address: true } };
    attachment: true;
    lines: { orderBy: { id: 'asc' } };
  };
}>;

function toDateOnlyString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function numberFromDecimal(value: Prisma.Decimal | number): number {
  return Number(value);
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
    unitCost: numberFromDecimal(line.unitCost),
    lineTotal: numberFromDecimal(line.lineTotal),
    estimatedProductionDays: line.estimatedProductionDays,
    notes: line.notes,
    createdAt: toIsoDateString(line.createdAt),
    updatedAt: toIsoDateString(line.updatedAt),
  };
}

export async function toSupplierQuoteResponse(
  quote: SupplierQuoteWithRelations,
  storageService: IStorageService,
): Promise<SupplierQuoteResponse> {
  return {
    id: toApiId(quote.id),
    supplier: toSupplierResponse(quote.supplier),
    attachment: quote.attachment
      ? await FileUploadMapper.toResponse(quote.attachment, storageService)
      : null,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    quoteDate: toDateOnlyString(quote.quoteDate),
    validUntil: toDateOnlyString(quote.validUntil),
    currencyCode: quote.currencyCode,
    subtotalAmount: numberFromDecimal(quote.subtotalAmount),
    shippingAmount: numberFromDecimal(quote.shippingAmount),
    taxAmount: numberFromDecimal(quote.taxAmount),
    totalAmount: numberFromDecimal(quote.totalAmount),
    incoterm: quote.incoterm,
    paymentTerms: quote.paymentTerms,
    loadingPort: quote.loadingPort,
    destinationPort: quote.destinationPort,
    notes: quote.notes,
    acceptedAt: quote.acceptedAt ? toIsoDateString(quote.acceptedAt) : null,
    rejectedAt: quote.rejectedAt ? toIsoDateString(quote.rejectedAt) : null,
    acceptedByUserId: quote.acceptedByUserId
      ? toApiId(quote.acceptedByUserId)
      : null,
    lines: quote.lines.map(toSupplierQuoteLineResponse),
    createdAt: toIsoDateString(quote.createdAt),
    updatedAt: toIsoDateString(quote.updatedAt),
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
