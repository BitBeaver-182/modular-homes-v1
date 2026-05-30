import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type SupplierQuoteStatus } from '@prisma/client';
import { QuerybuilderService } from 'nestjs-prisma-querybuilder';
import type {
  CreateSupplierQuoteRequest,
  SupplierQuoteLineRequest,
  SupplierQuoteListResponse,
  UpdateSupplierQuoteRequest,
} from '@moduflow/types';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import type { AuthenticatedActor } from '../../auth/auth.types';
import type { SupplierQuoteWithRelations } from './mappers/supplier-quote.mapper';

const SORT_FIELDS = [
  'createdAt',
  'quoteDate',
  'validUntil',
  'totalAmount',
  'status',
  'supplier.name',
  'quoteNumber',
] as const;
const BLOCKED_QUERY_KEYS = [
  'deletedAt',
  'distinct',
  'filter',
  'include',
  'organizationId',
  'populate',
  'raw',
  'select',
] as const;

type SupplierQuoteSortField = (typeof SORT_FIELDS)[number];
type SupplierQuoteQuery = Record<string, unknown>;
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
    private readonly querybuilder: QuerybuilderService<PrismaService>,
    private readonly storageService: StorageService,
  ) {}

  getStorageService(): StorageService {
    return this.storageService;
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
      const quote = await this.prisma.supplierQuote.create({
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
          incoterm: normalizeOptionalString(dto.incoterm),
          paymentTerms: normalizeOptionalString(dto.paymentTerms),
          loadingPort: normalizeOptionalString(dto.loadingPort),
          destinationPort: normalizeOptionalString(dto.destinationPort),
          notes: normalizeOptionalString(dto.notes),
          ...statusData,
          lines: {
            create: sanitizeLines(actor.organizationId, dto.lines),
          },
        },
        include: INCLUDE_RELATIONS,
      });

      return quote;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Quote number must be unique');
      }
      throw error;
    }
  }

  async findAll(
    organizationId: bigint,
    query: SupplierQuoteQuery,
  ): Promise<{
    data: SupplierQuoteWithRelations[];
    meta: SupplierQuoteListMeta;
  }> {
    assertSupportedQuery(query);

    const builtQuery = await this.querybuilder.query({
      model: 'supplierQuote',
      paginationOnly: true,
      setHeaders: false,
    });

    const take = toPositiveNumber(builtQuery.take, 10);
    const skip = toNonNegativeNumber(builtQuery.skip, 0);
    const page = Math.floor(skip / take) + 1;
    const where = buildSupplierQuoteWhere(organizationId, query);
    const orderBy = getSafeOrderBy(builtQuery.orderBy);

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

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.lines !== undefined) {
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
            ...(dto.incoterm !== undefined
              ? { incoterm: normalizeOptionalString(dto.incoterm) }
              : {}),
            ...(dto.paymentTerms !== undefined
              ? { paymentTerms: normalizeOptionalString(dto.paymentTerms) }
              : {}),
            ...(dto.loadingPort !== undefined
              ? { loadingPort: normalizeOptionalString(dto.loadingPort) }
              : {}),
            ...(dto.destinationPort !== undefined
              ? {
                  destinationPort: normalizeOptionalString(dto.destinationPort),
                }
              : {}),
            ...(dto.notes !== undefined
              ? { notes: normalizeOptionalString(dto.notes) }
              : {}),
            ...statusData,
            ...(dto.lines !== undefined
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
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BadRequestException('Quote number must be unique');
      }
      throw error;
    }
  }

  async remove(organizationId: bigint, id: bigint): Promise<void> {
    await this.findOne(organizationId, id);
    await this.prisma.supplierQuote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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
    totalAmount: input.totalAmount ?? Number(current.totalAmount),
    incoterm: input.incoterm ?? current.incoterm,
    paymentTerms: input.paymentTerms ?? current.paymentTerms,
    loadingPort: input.loadingPort ?? current.loadingPort,
    destinationPort: input.destinationPort ?? current.destinationPort,
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
  status: SupplierQuoteStatus,
  actor: AuthenticatedActor,
): Pick<
  Prisma.SupplierQuoteUncheckedCreateInput,
  'acceptedAt' | 'rejectedAt' | 'acceptedByUserId'
> {
  if (status === 'accepted') {
    return {
      acceptedAt: new Date(),
      acceptedByUserId: actor.userId,
      rejectedAt: null,
    };
  }
  if (status === 'rejected') {
    return {
      acceptedAt: null,
      acceptedByUserId: null,
      rejectedAt: new Date(),
    };
  }
  return {
    acceptedAt: null,
    acceptedByUserId: null,
    rejectedAt: null,
  };
}

function buildSupplierQuoteWhere(
  organizationId: bigint,
  query: SupplierQuoteQuery,
): Prisma.SupplierQuoteWhereInput {
  const where: Prisma.SupplierQuoteWhereInput = {
    organizationId,
    deletedAt: null,
  };
  const search = getStringValue(query.search)?.trim();
  const statuses = getStringArray(query.status);
  const supplierIds = getStringArray(query.supplierIds).map((id) =>
    parseBigIntId(id, 'supplierId'),
  );
  const currencyCode = getStringValue(query.currencyCode)?.trim().toUpperCase();

  if (statuses.length > 0) {
    where.status = { in: statuses as SupplierQuoteStatus[] };
  }
  if (supplierIds.length > 0) {
    where.supplierId = { in: supplierIds };
  }
  if (currencyCode) {
    where.currencyCode = currencyCode;
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
    where.OR = [
      { quoteNumber: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      { incoterm: { contains: search, mode: 'insensitive' } },
      { paymentTerms: { contains: search, mode: 'insensitive' } },
      { loadingPort: { contains: search, mode: 'insensitive' } },
      { destinationPort: { contains: search, mode: 'insensitive' } },
      {
        supplier: {
          is: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  return where;
}

function addDateRange(
  where: Prisma.SupplierQuoteWhereInput,
  field: 'quoteDate' | 'validUntil',
  fromValue: unknown,
  toValue: unknown,
): void {
  const from = parseOptionalDate(getStringValue(fromValue));
  const to = parseOptionalDate(getStringValue(toValue));
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

function assertSupportedQuery(query: SupplierQuoteQuery): void {
  for (const key of Object.keys(query)) {
    if (isBlockedQueryKey(key) || hasBlockedNestedQueryKey(key)) {
      throw new BadRequestException(
        `Unsupported supplier quote query parameter: ${key}`,
      );
    }
    if (!isAllowedQueryKey(key)) {
      throw new BadRequestException(
        `Unsupported supplier quote query parameter: ${key}`,
      );
    }
  }
  assertSafeSort(query);
}

function isAllowedQueryKey(key: string): boolean {
  return [
    'page',
    'limit',
    'search',
    'sort',
    'sort[field]',
    'sort[criteria]',
    'status',
    'status[]',
    'supplierIds',
    'supplierIds[]',
    'quoteDateFrom',
    'quoteDateTo',
    'validUntilFrom',
    'validUntilTo',
    'totalAmountMin',
    'totalAmountMax',
    'currencyCode',
  ].includes(key);
}

function isBlockedQueryKey(key: string): boolean {
  return (BLOCKED_QUERY_KEYS as ReadonlyArray<string>).includes(key);
}

function hasBlockedNestedQueryKey(key: string): boolean {
  return BLOCKED_QUERY_KEYS.some((blockedKey) =>
    key.startsWith(`${blockedKey}[`),
  );
}

function assertSafeSort(query: SupplierQuoteQuery): void {
  const flatField = getStringValue(query['sort[field]']);
  const flatCriteria = getStringValue(query['sort[criteria]']);
  const nestedSort = query.sort;

  if (Array.isArray(nestedSort)) {
    throw new BadRequestException(
      'Only one supplier quote sort field is supported',
    );
  }
  if (nestedSort !== undefined && !isPlainObject(nestedSort)) {
    throw new BadRequestException('Invalid supplier quote sort parameter');
  }
  if (isPlainObject(nestedSort)) {
    for (const key of Object.keys(nestedSort)) {
      if (key !== 'field' && key !== 'criteria') {
        throw new BadRequestException(
          `Unsupported supplier quote sort parameter: ${key}`,
        );
      }
    }
  }

  const field = flatField ?? getStringValue(nestedSort?.field);
  const criteria = flatCriteria ?? getStringValue(nestedSort?.criteria);
  if (field && !isSupplierQuoteSortField(field)) {
    throw new BadRequestException(
      `Unsupported supplier quote sort field: ${field}`,
    );
  }
  if (criteria && criteria !== 'asc' && criteria !== 'desc') {
    throw new BadRequestException(
      'Supplier quote sort criteria must be asc or desc',
    );
  }
}

function getSafeOrderBy(
  rawOrderBy: unknown,
): Prisma.SupplierQuoteOrderByWithRelationInput[] {
  if (rawOrderBy == null) {
    return [{ createdAt: 'desc' }, { id: 'asc' }];
  }
  const orderItems = Array.isArray(rawOrderBy) ? rawOrderBy : [rawOrderBy];
  const safeOrderBy = orderItems.map((item) => {
    if (!isPlainObject(item)) {
      throw new BadRequestException('Invalid supplier quote sort parameter');
    }
    const entries = Object.entries(item);
    if (entries.length !== 1) {
      throw new BadRequestException(
        'Only one field is allowed per supplier quote sort',
      );
    }
    const [[field, direction]] = entries;
    if (!isSupplierQuoteSortField(field)) {
      throw new BadRequestException(
        `Unsupported supplier quote sort field: ${field}`,
      );
    }
    if (direction !== 'asc' && direction !== 'desc') {
      throw new BadRequestException(
        'Supplier quote sort criteria must be asc or desc',
      );
    }
    const sortDirection: Prisma.SortOrder =
      direction === 'asc' ? 'asc' : 'desc';
    if (field === 'supplier.name') {
      return { supplier: { name: sortDirection } };
    }
    return { [field]: sortDirection };
  });
  return [...safeOrderBy, { id: 'asc' }];
}

function isSupplierQuoteSortField(
  field: string,
): field is SupplierQuoteSortField {
  return (SORT_FIELDS as ReadonlyArray<string>).includes(field);
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

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value !== '') {
    return [value];
  }
  return [];
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : fallback;
}

function toNonNegativeNumber(value: unknown, fallback: number): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0
    ? numericValue
    : fallback;
}

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
