import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type SupplierQuoteStatus as PersistedSupplierQuoteStatus,
} from '@prisma/client';
import type {
  CreateSupplierQuoteRequest,
  SupplierQuoteLineRequest,
  SupplierQuoteListResponse,
  SupplierQuoteResponse,
  SupplierQuoteStatus,
  UpdateSupplierQuoteRequest,
} from '@moduflow/types';
import type { AuthenticatedActor } from '../../auth/auth.types';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { SupplierQuoteFilterDto } from './dto/supplier-quote-filter.dto';
import {
  toSupplierQuoteListResponse,
  toSupplierQuoteResponse,
  type SupplierQuoteWithRelations,
} from './mappers/supplier-quote.mapper';

type SupplierQuoteListMeta = SupplierQuoteListResponse['meta'];
type SupplierQuoteWrite =
  | CreateSupplierQuoteRequest
  | UpdateSupplierQuoteRequest;

const INCLUDE_RELATIONS = {
  supplier: { include: { address: true } },
  attachment: true,
  lines: { orderBy: { id: 'asc' } },
} satisfies Prisma.SupplierQuoteInclude;

@Injectable()
export class SupplierQuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createResponse(
    actor: AuthenticatedActor,
    dto: CreateSupplierQuoteRequest,
  ): Promise<SupplierQuoteResponse> {
    return toSupplierQuoteResponse(
      await this.create(actor, dto),
      this.storageService,
    );
  }

  async findAllResponse(
    organizationId: bigint,
    query: SupplierQuoteFilterDto,
  ): Promise<SupplierQuoteListResponse> {
    const result = await this.findAll(organizationId, query);

    return toSupplierQuoteListResponse(
      result.data,
      result.meta,
      this.storageService,
    );
  }

  async findOneResponse(
    organizationId: bigint,
    id: bigint,
  ): Promise<SupplierQuoteResponse> {
    return toSupplierQuoteResponse(
      await this.findOne(organizationId, id),
      this.storageService,
    );
  }

  async updateResponse(
    actor: AuthenticatedActor,
    id: bigint,
    dto: UpdateSupplierQuoteRequest,
  ): Promise<SupplierQuoteResponse> {
    return toSupplierQuoteResponse(
      await this.update(actor, id, dto),
      this.storageService,
    );
  }

  async create(
    actor: AuthenticatedActor,
    dto: CreateSupplierQuoteRequest,
  ): Promise<SupplierQuoteWithRelations> {
    const supplierId = parseBigIntId(dto.supplierId, 'supplierId');
    await this.assertSupplierBelongsToOrganization(
      actor.organizationId,
      supplierId,
    );
    await this.assertQuoteNumberAvailable(
      actor.organizationId,
      normalizeOptionalString(dto.quoteNumber),
    );
    await this.assertAttachmentAvailable(
      actor.organizationId,
      dto.attachmentId,
    );

    const amounts = calculateAmounts(dto);
    const statusData = getStatusAuditData(dto.status ?? 'received', actor);

    try {
      return await this.prisma.supplierQuote.create({
        data: {
          organizationId: actor.organizationId,
          supplierId,
          attachmentId: normalizeOptionalString(dto.attachmentId),
          quoteNumber: normalizeOptionalString(dto.quoteNumber),
          status: dto.status ?? 'received',
          quoteDate: parseOptionalDate(dto.quoteDate),
          validUntil: parseOptionalDate(dto.validUntil),
          currencyCode: normalizeCurrency(dto.currencyCode),
          subtotalAmount: amounts.subtotalAmount,
          shippingAmount: amounts.shippingAmount,
          taxAmount: amounts.taxAmount,
          totalAmount: amounts.totalAmount,
          paymentTerms: normalizeOptionalString(dto.paymentTerms),
          notes: normalizeOptionalString(dto.notes),
          ...statusData,
          lines: {
            create: sanitizeLines(actor.organizationId, dto.lines),
          },
        },
        include: INCLUDE_RELATIONS,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Quote number must be unique');
      }
      throw error;
    }
  }

  async findAll(
    organizationId: bigint,
    query: SupplierQuoteFilterDto,
  ): Promise<{
    data: SupplierQuoteWithRelations[];
    meta: SupplierQuoteListMeta;
  }> {
    const take = query.limit ?? 10;
    const page = query.page ?? 1;
    const skip = (page - 1) * take;
    const where = buildSupplierQuoteWhere(organizationId, query);
    const orderBy = getSafeOrderBy(query);

    const [data, total] = await Promise.all([
      this.prisma.supplierQuote.findMany({
        where,
        orderBy,
        skip,
        take,
        include: INCLUDE_RELATIONS,
      }),
      this.prisma.supplierQuote.count({ where }),
    ]);

    return {
      data,
      meta: {
        pagination: {
          page,
          pageSize: take,
          pageCount: Math.ceil(total / take),
          total,
        },
      },
    };
  }

  async findOne(
    organizationId: bigint,
    id: bigint,
  ): Promise<SupplierQuoteWithRelations> {
    const quote = await this.prisma.supplierQuote.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: INCLUDE_RELATIONS,
    });

    if (!quote) {
      throw new NotFoundException('Supplier quote not found');
    }

    return quote;
  }

  async update(
    actor: AuthenticatedActor,
    id: bigint,
    dto: UpdateSupplierQuoteRequest,
  ): Promise<SupplierQuoteWithRelations> {
    const current = await this.findOne(actor.organizationId, id);
    const supplierId =
      dto.supplierId !== undefined
        ? parseBigIntId(dto.supplierId, 'supplierId')
        : current.supplierId;

    if (dto.supplierId !== undefined) {
      await this.assertSupplierBelongsToOrganization(
        actor.organizationId,
        supplierId,
      );
    }

    const nextQuoteNumber =
      dto.quoteNumber !== undefined
        ? normalizeOptionalString(dto.quoteNumber)
        : current.quoteNumber;
    await this.assertQuoteNumberAvailable(
      actor.organizationId,
      nextQuoteNumber,
      id,
    );

    if (dto.attachmentId !== undefined) {
      await this.assertAttachmentAvailable(
        actor.organizationId,
        dto.attachmentId,
        id,
      );
    }

    const merged = mergeQuoteInput(current, dto);
    const amounts = calculateAmounts(merged);
    const statusData =
      dto.status !== undefined ? getStatusAuditData(dto.status, actor) : {};
    const previousAttachmentId = current.attachmentId;
    const nextAttachmentId =
      dto.attachmentId !== undefined
        ? normalizeOptionalString(dto.attachmentId)
        : current.attachmentId;

    try {
      const updatedQuote = await this.prisma.$transaction(async (tx) => {
        if (hasLineReplacements(dto.lines)) {
          await tx.supplierQuoteLine.deleteMany({
            where: {
              supplierQuoteId: id,
              organizationId: actor.organizationId,
            },
          });
        }

        return tx.supplierQuote.update({
          where: { id },
          data: {
            ...(dto.supplierId !== undefined ? { supplierId } : {}),
            ...(dto.attachmentId !== undefined
              ? { attachmentId: normalizeOptionalString(dto.attachmentId) }
              : {}),
            ...(dto.quoteNumber !== undefined
              ? { quoteNumber: nextQuoteNumber }
              : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.quoteDate !== undefined
              ? { quoteDate: parseOptionalDate(dto.quoteDate) }
              : {}),
            ...(dto.validUntil !== undefined
              ? { validUntil: parseOptionalDate(dto.validUntil) }
              : {}),
            ...(dto.currencyCode !== undefined
              ? { currencyCode: normalizeCurrency(dto.currencyCode) }
              : {}),
            subtotalAmount: amounts.subtotalAmount,
            shippingAmount: amounts.shippingAmount,
            taxAmount: amounts.taxAmount,
            totalAmount: amounts.totalAmount,
            ...(dto.paymentTerms !== undefined
              ? { paymentTerms: normalizeOptionalString(dto.paymentTerms) }
              : {}),
            ...(dto.notes !== undefined
              ? { notes: normalizeOptionalString(dto.notes) }
              : {}),
            ...statusData,
            ...(hasLineReplacements(dto.lines)
              ? {
                  lines: {
                    create: sanitizeLines(actor.organizationId, dto.lines),
                  },
                }
              : {}),
          },
          include: INCLUDE_RELATIONS,
        });
      });

      if (previousAttachmentId && previousAttachmentId !== nextAttachmentId) {
        await this.cleanupStoredUpload(actor.organizationId, previousAttachmentId);
      }

      return updatedQuote;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Quote number must be unique');
      }
      throw error;
    }
  }

  async remove(organizationId: bigint, id: bigint): Promise<void> {
    const quote = await this.findOne(organizationId, id);
    await this.prisma.supplierQuote.update({
      where: { id },
      data: {
        attachmentId: null,
        deletedAt: new Date(),
      },
    });

    await this.cleanupStoredUpload(organizationId, quote.attachmentId);
  }

  private async assertSupplierBelongsToOrganization(
    organizationId: bigint,
    supplierId: bigint,
  ): Promise<void> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier does not belong to organization');
    }
  }

  private async assertQuoteNumberAvailable(
    organizationId: bigint,
    quoteNumber: string | null,
    currentQuoteId?: bigint,
  ): Promise<void> {
    if (!quoteNumber) {
      return;
    }

    const existing = await this.prisma.supplierQuote.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        quoteNumber: { equals: quoteNumber, mode: 'insensitive' },
        ...(currentQuoteId ? { id: { not: currentQuoteId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Quote number must be unique');
    }
  }

  private async assertAttachmentAvailable(
    organizationId: bigint,
    attachmentId: string | null | undefined,
    currentQuoteId?: bigint,
  ): Promise<void> {
    const normalized = normalizeOptionalString(attachmentId);
    if (!normalized) {
      return;
    }

    const upload = await this.prisma.fileUpload.findFirst({
      where: {
        id: normalized,
        organizationId,
        context: 'SUPPLIER_DOCUMENT',
        status: 'CONFIRMED',
      },
      select: { id: true },
    });

    if (!upload) {
      throw new BadRequestException(
        'Attachment must be a confirmed supplier document',
      );
    }

    const existingQuote = await this.prisma.supplierQuote.findFirst({
      where: {
        attachmentId: normalized,
        organizationId,
        deletedAt: null,
        ...(currentQuoteId ? { id: { not: currentQuoteId } } : {}),
      },
      select: { id: true },
    });

    if (existingQuote) {
      throw new BadRequestException('Attachment is already linked to a quote');
    }
  }

  private async cleanupStoredUpload(
    organizationId: bigint,
    attachmentId: string | null,
  ): Promise<void> {
    if (!attachmentId) {
      return;
    }

    const upload = await this.prisma.fileUpload.findFirst({
      where: {
        id: attachmentId,
        organizationId,
        status: { not: 'DELETED' },
      },
      select: {
        id: true,
        context: true,
        key: true,
      },
    });

    if (!upload) {
      return;
    }

    await this.storageService.delete(upload.context, upload.key);
    await this.prisma.fileUpload.updateMany({
      where: {
        id: attachmentId,
        organizationId,
        status: { not: 'DELETED' },
      },
      data: {
        status: 'DELETED',
      },
    });
  }
}

function sanitizeLines(
  organizationId: bigint,
  lines: SupplierQuoteLineRequest[] | undefined,
): Prisma.SupplierQuoteLineCreateWithoutSupplierQuoteInput[] {
  return (lines ?? []).map((line) => {
    const quantity = line.quantity;
    const unitCost = decimal(line.unitCost);
    const lineTotal = decimal(quantity * line.unitCost);

    return {
      organizationId,
      houseModelId: parseOptionalBigInt(line.houseModelId, 'houseModelId'),
      productConfigurationId: parseOptionalBigInt(
        line.productConfigurationId,
        'productConfigurationId',
      ),
      description: normalizeOptionalString(line.description),
      quantity,
      unitCost,
      lineTotal,
      estimatedProductionDays: line.estimatedProductionDays ?? null,
      notes: normalizeOptionalString(line.notes),
    };
  });
}

function calculateAmounts(input: SupplierQuoteWrite): {
  subtotalAmount: Prisma.Decimal;
  shippingAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
} {
  const hasLines = Array.isArray(input.lines) && input.lines.length > 0;
  // When line items are provided, they become the source of truth for totals.
  // Explicit subtotal/total inputs are only used when there is no line payload.
  const lineSubtotal = hasLines
    ? input.lines!.reduce((sum, line) => sum + line.quantity * line.unitCost, 0)
    : undefined;
  const subtotalAmount = lineSubtotal ?? input.subtotalAmount ?? 0;
  const shippingAmount = input.shippingAmount ?? 0;
  const taxAmount = input.taxAmount ?? 0;
  const totalAmount =
    hasLines || input.totalAmount === undefined
      ? subtotalAmount + shippingAmount + taxAmount
      : input.totalAmount;

  return {
    subtotalAmount: decimal(subtotalAmount),
    shippingAmount: decimal(shippingAmount),
    taxAmount: decimal(taxAmount),
    totalAmount: decimal(totalAmount),
  };
}

function mergeQuoteInput(
  current: SupplierQuoteWithRelations,
  input: UpdateSupplierQuoteRequest,
): SupplierQuoteWrite {
  const shouldRecomputeTotal =
    input.totalAmount === undefined &&
    (input.subtotalAmount !== undefined ||
      input.shippingAmount !== undefined ||
      input.taxAmount !== undefined ||
      input.lines !== undefined);

  return {
    supplierId: current.supplierId.toString(),
    attachmentId: current.attachmentId,
    quoteNumber: current.quoteNumber,
    status: input.status ?? current.status,
    quoteDate:
      input.quoteDate ??
      (current.quoteDate ? current.quoteDate.toISOString().slice(0, 10) : null),
    validUntil:
      input.validUntil ??
      (current.validUntil
        ? current.validUntil.toISOString().slice(0, 10)
        : null),
    currencyCode: input.currencyCode ?? current.currencyCode,
    subtotalAmount: input.subtotalAmount ?? Number(current.subtotalAmount),
    shippingAmount: input.shippingAmount ?? Number(current.shippingAmount),
    taxAmount: input.taxAmount ?? Number(current.taxAmount),
    totalAmount: shouldRecomputeTotal
      ? undefined
      : input.totalAmount ?? Number(current.totalAmount),
    paymentTerms: input.paymentTerms ?? current.paymentTerms,
    notes: input.notes ?? current.notes,
    lines:
      input.lines ??
      current.lines.map((line) => ({
        id: line.id.toString(),
        houseModelId: line.houseModelId?.toString() ?? null,
        productConfigurationId: line.productConfigurationId?.toString() ?? null,
        description: line.description,
        quantity: line.quantity,
        unitCost: Number(line.unitCost),
        estimatedProductionDays: line.estimatedProductionDays,
        notes: line.notes,
      })),
  };
}

function getStatusAuditData(
  status: PersistedSupplierQuoteStatus,
  actor: AuthenticatedActor,
): Pick<
  Prisma.SupplierQuoteUncheckedCreateInput,
  'statusUpdatedAt' | 'statusUpdatedByUserId'
> {
  if (status === 'accepted' || status === 'rejected') {
    return {
      statusUpdatedAt: new Date(),
      statusUpdatedByUserId: actor.userId,
    };
  }

  return {
    statusUpdatedAt: null,
    statusUpdatedByUserId: null,
  };
}

function buildSupplierQuoteWhere(
  organizationId: bigint,
  query: SupplierQuoteFilterDto,
): Prisma.SupplierQuoteWhereInput {
  const where: Prisma.SupplierQuoteWhereInput = {
    organizationId,
    deletedAt: null,
  };
  const andFilters: Prisma.SupplierQuoteWhereInput[] = [];
  const search = normalizeOptionalString(query.search);
  const supplierIds = (query.supplierIds ?? []).map((id) =>
    parseBigIntId(id, 'supplierId'),
  );

  addStatusFilter(andFilters, query.status ?? []);

  if (supplierIds.length > 0) {
    where.supplierId = { in: supplierIds };
  }
  if (query.currencyCode) {
    where.currencyCode = query.currencyCode;
  }

  addDateRange(where, 'quoteDate', query.quoteDateFrom, query.quoteDateTo);
  addDateRange(where, 'validUntil', query.validUntilFrom, query.validUntilTo);
  addNumberRange(
    where,
    'totalAmount',
    query.totalAmountMin,
    query.totalAmountMax,
  );

  if (search) {
    andFilters.push({
      OR: [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { paymentTerms: { contains: search, mode: 'insensitive' } },
        {
          attachment: {
            is: {
              filename: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          attachment: {
            is: {
              key: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          supplier: {
            is: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ],
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return where;
}

function addStatusFilter(
  andFilters: Prisma.SupplierQuoteWhereInput[],
  statuses: SupplierQuoteStatus[],
): void {
  if (statuses.length === 0) {
    return;
  }

  const persistedStatuses = statuses.filter(
    (status): status is PersistedSupplierQuoteStatus => status !== 'expired',
  );
  const statusFilters: Prisma.SupplierQuoteWhereInput[] = [];

  if (persistedStatuses.length > 0) {
    statusFilters.push({ status: { in: persistedStatuses } });
  }

  if (statuses.includes('expired')) {
    statusFilters.push({
      status: 'received',
      validUntil: { lt: startOfUtcToday() },
    });
  }

  andFilters.push(
    statusFilters.length === 1 ? statusFilters[0] : { OR: statusFilters },
  );
}

function addDateRange(
  where: Prisma.SupplierQuoteWhereInput,
  field: 'quoteDate' | 'validUntil',
  fromValue: string | undefined,
  toValue: string | undefined,
): void {
  const from = parseOptionalDate(fromValue);
  const to = parseOptionalDate(toValue);
  if (!from && !to) {
    return;
  }

  where[field] = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

function addNumberRange(
  where: Prisma.SupplierQuoteWhereInput,
  field: 'totalAmount',
  minValue: unknown,
  maxValue: unknown,
): void {
  const min = toOptionalNumber(minValue);
  const max = toOptionalNumber(maxValue);
  if (min === undefined && max === undefined) {
    return;
  }

  where[field] = {
    ...(min !== undefined ? { gte: decimal(min) } : {}),
    ...(max !== undefined ? { lte: decimal(max) } : {}),
  };
}

function getSafeOrderBy(
  query: SupplierQuoteFilterDto,
): Prisma.SupplierQuoteOrderByWithRelationInput[] {
  const field = query.sortField;
  const direction = query.sortCriteria;

  if (!field || !direction) {
    return [{ createdAt: 'desc' }, { id: 'asc' }];
  }

  if (field === 'supplier.name') {
    return [{ supplier: { name: direction } }, { id: 'asc' }];
  }

  return [{ [field]: direction }, { id: 'asc' }];
}

function hasLineReplacements(
  lines: SupplierQuoteLineRequest[] | undefined,
): lines is SupplierQuoteLineRequest[] {
  return Array.isArray(lines) && lines.length > 0;
}

function parseOptionalBigInt(
  value: string | null | undefined,
  fieldName: string,
): bigint | null {
  const normalized = normalizeOptionalString(value);
  return normalized ? parseBigIntId(normalized, fieldName) : null;
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  const normalized = normalizeOptionalString(value);
  return normalized
    ? new Date(`${normalized.slice(0, 10)}T00:00:00.000Z`)
    : null;
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeCurrency(value: string | undefined): string {
  return (value?.trim().toUpperCase() || 'USD').slice(0, 3);
}

function decimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function startOfUtcToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
