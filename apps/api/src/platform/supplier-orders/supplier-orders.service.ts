import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type SupplierOrderStatus as PersistedSupplierOrderStatus,
} from '@prisma/client';
import type { AuthenticatedActor } from '../../auth/auth.types';
import { PrismaService } from '../../database/prisma.service';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { SupplierOrderFilterDto } from './dto/supplier-order-filter.dto';
import {
  CreateSupplierOrderInvoiceDto,
  UpdateSupplierOrderInvoiceDto,
} from './dto/supplier-order-invoice.dto';
import { UpdateSupplierOrderDto } from './dto/update-supplier-order.dto';
import type { SupplierOrderWithRelations } from './mappers/supplier-order.mapper';
import type { CreateSupplierOrderRequest } from '@moduflow/types';

type SupplierOrderListMeta = {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
};

const INCLUDE_RELATIONS = {
  supplier: { include: { address: true } },
  supplierQuote: {
    include: {
      supplier: { include: { address: true } },
    },
  },
  lines: {
    orderBy: { id: 'asc' },
  },
  invoices: {
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.SupplierOrderInclude;

const STATUS_MAP = {
  draft: ['draft'],
  processing: ['placed', 'confirmed', 'in_production', 'ready_to_ship'],
  shipped: ['shipped'],
  delivered: ['arrived', 'closed'],
  cancelled: ['cancelled'],
} satisfies Record<string, PersistedSupplierOrderStatus[]>;

const TERMINAL_ORDER_STATUSES = new Set<PersistedSupplierOrderStatus>([
  'shipped',
  'arrived',
  'closed',
  'cancelled',
]);

@Injectable()
export class SupplierOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    actor: AuthenticatedActor,
    dto: CreateSupplierOrderRequest,
  ): Promise<SupplierOrderWithRelations> {
    const quoteId = parseBigIntId(dto.quoteId, 'quoteId');
    const quote = await this.prisma.supplierQuote.findFirst({
      where: {
        id: quoteId,
        organizationId: actor.organizationId,
        deletedAt: null,
      },
      include: {
        supplier: { include: { address: true } },
        lines: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!quote) {
      throw new BadRequestException('Supplier quote not found');
    }
    if (quote.status !== 'accepted') {
      throw new BadRequestException(
        'Only accepted quotes can be converted into supplier orders',
      );
    }
    if (isExpiredQuote(quote.validUntil)) {
      throw new BadRequestException(
        'Expired quotes cannot be converted into supplier orders',
      );
    }

    const existingOrder = await this.prisma.supplierOrder.findFirst({
      where: {
        organizationId: actor.organizationId,
        supplierQuoteId: quote.id,
      },
      select: { id: true },
    });

    if (existingOrder) {
      throw new BadRequestException(
        'A supplier order already exists for this quote',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.supplierOrder.create({
        data: {
          organizationId: actor.organizationId,
          supplierId: quote.supplierId,
          supplierQuoteId: quote.id,
          status: 'draft',
          currencyCode: quote.currencyCode,
          subtotalAmount: quote.subtotalAmount,
          shippingAmount: quote.shippingAmount,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          paymentTerms: quote.paymentTerms,
          notes: quote.notes,
          createdByUserId: actor.userId,
          lines: {
            create: quote.lines.map((line) => ({
              organizationId: actor.organizationId,
              supplierQuoteLineId: line.id,
              houseModelId: line.houseModelId,
              productConfigurationId: line.productConfigurationId,
              description: line.description,
              quantity: line.quantity,
              unitCost: line.unitCost,
              lineTotal: line.lineTotal,
            })),
          },
        },
        select: { id: true },
      });

      return tx.supplierOrder.update({
        where: { id: createdOrder.id },
        data: {
          orderNumber: formatOrderNumber(createdOrder.id),
        },
        include: INCLUDE_RELATIONS,
      });
    });
  }

  async findAll(
    organizationId: bigint,
    query: SupplierOrderFilterDto,
  ): Promise<{
    data: SupplierOrderWithRelations[];
    meta: SupplierOrderListMeta;
  }> {
    const take = query.limit ?? 10;
    const page = query.page ?? 1;
    const skip = (page - 1) * take;
    const where = buildSupplierOrderWhere(organizationId, query);
    const orderBy = getSafeOrderBy(query);

    const [data, total] = await Promise.all([
      this.prisma.supplierOrder.findMany({
        where,
        orderBy,
        skip,
        take,
        include: INCLUDE_RELATIONS,
      }),
      this.prisma.supplierOrder.count({ where }),
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
    id: string,
  ): Promise<SupplierOrderWithRelations> {
    const parsedId = parseBigIntId(id, 'id');
    const order = await this.prisma.supplierOrder.findFirst({
      where: {
        id: parsedId,
        organizationId,
      },
      include: INCLUDE_RELATIONS,
    });

    if (!order) {
      throw new NotFoundException('Supplier order not found');
    }

    return order;
  }

  async update(
    organizationId: bigint,
    id: string,
    dto: UpdateSupplierOrderDto,
  ): Promise<SupplierOrderWithRelations> {
    const order = await this.findOne(organizationId, id);

    if (dto.orderLines === undefined) {
      return order;
    }
    if (TERMINAL_ORDER_STATUSES.has(order.status)) {
      throw new BadRequestException(
        `Supplier orders in status ${order.status} cannot be edited`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const currentOrder = await tx.supplierOrder.findFirst({
        where: {
          id: order.id,
          organizationId,
        },
        include: {
          lines: {
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!currentOrder) {
        throw new NotFoundException('Supplier order not found');
      }

      const nextLines = dto.orderLines ?? [];
      const existingLineIds = new Set(
        currentOrder.lines.map((line) => line.id),
      );
      const existingLinesById = new Map(
        currentOrder.lines.map((line) => [line.id, line] as const),
      );
      const providedExistingLineIds = new Set<bigint>();

      for (const line of nextLines) {
        if (!line.id) {
          assertNoNewLineReferences(line);
          continue;
        }

        const parsedLineId = parseBigIntId(line.id, 'orderLineId');
        const existingLine = existingLinesById.get(parsedLineId);

        if (!existingLine) {
          throw new BadRequestException(
            `Supplier order line ${line.id} does not belong to this order`,
          );
        }
        assertExistingLineReferencesMatch(existingLine, line);

        if (providedExistingLineIds.has(parsedLineId)) {
          throw new BadRequestException(
            `Duplicate supplier order line id ${line.id}`,
          );
        }
        if (!existingLineIds.has(parsedLineId)) {
          throw new BadRequestException(
            `Supplier order line ${line.id} does not belong to this order`,
          );
        }

        providedExistingLineIds.add(parsedLineId);
      }

      const lineData = nextLines.map((line) => {
        const quantity = line.quantity;
        const unitCost = new Prisma.Decimal(line.unitCost);
        const existingLine = line.id
          ? existingLinesById.get(parseBigIntId(line.id, 'orderLineId'))
          : null;

        return {
          id: existingLine?.id ?? null,
          supplierQuoteLineId: existingLine?.supplierQuoteLineId ?? null,
          houseModelId: existingLine?.houseModelId ?? null,
          productConfigurationId: existingLine?.productConfigurationId ?? null,
          description: line.description ?? null,
          quantity,
          unitCost,
          lineTotal: unitCost.mul(quantity),
        };
      });

      const idsToKeep = lineData
        .map((line) => line.id)
        .filter((lineId): lineId is bigint => lineId !== null);

      await tx.supplierOrderLine.deleteMany({
        where: {
          supplierOrderId: order.id,
          ...(idsToKeep.length > 0 ? { id: { notIn: idsToKeep } } : {}),
        },
      });

      for (const line of lineData) {
        const writeData = {
          organizationId,
          supplierOrderId: order.id,
          supplierQuoteLineId: line.supplierQuoteLineId,
          houseModelId: line.houseModelId,
          productConfigurationId: line.productConfigurationId,
          description: line.description,
          quantity: line.quantity,
          unitCost: line.unitCost,
          lineTotal: line.lineTotal,
        };

        if (line.id) {
          await tx.supplierOrderLine.update({
            where: { id: line.id },
            data: writeData,
          });
        } else {
          await tx.supplierOrderLine.create({
            data: writeData,
          });
        }
      }

      const subtotalAmount = lineData.reduce(
        (sum, line) => sum.add(line.lineTotal),
        new Prisma.Decimal(0),
      );

      return tx.supplierOrder.update({
        where: { id: order.id },
        data: {
          subtotalAmount,
          totalAmount: subtotalAmount
            .add(currentOrder.shippingAmount)
            .add(currentOrder.taxAmount),
        },
        include: INCLUDE_RELATIONS,
      });
    });
  }

  async createInvoice(
    organizationId: bigint,
    orderId: string,
    dto: CreateSupplierOrderInvoiceDto,
  ) {
    const order = await this.findOne(organizationId, orderId);

    try {
      return await this.prisma.invoice.create({
        data: buildCreateInvoiceData(organizationId, order, dto),
      });
    } catch (error) {
      throw translateInvoiceWriteError(error);
    }
  }

  async updateInvoice(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    dto: UpdateSupplierOrderInvoiceDto,
  ) {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );

    try {
      return await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: buildUpdateInvoiceData(order, dto, invoice.amountPaid),
      });
    } catch (error) {
      throw translateInvoiceWriteError(error);
    }
  }

  async deleteInvoice(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
  ): Promise<void> {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );

    await this.prisma.invoice.delete({
      where: { id: invoice.id },
    });
  }

  private async findInvoiceForOrder(
    organizationId: bigint,
    supplierOrderId: bigint,
    invoiceId: string,
  ) {
    const parsedInvoiceId = parseBigIntId(invoiceId, 'invoiceId');
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: parsedInvoiceId,
        organizationId,
        supplierOrderId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Supplier order invoice not found');
    }

    return invoice;
  }
}

function buildCreateInvoiceData(
  organizationId: bigint,
  order: Pick<SupplierOrderWithRelations, 'id' | 'supplierId' | 'currencyCode'>,
  dto: CreateSupplierOrderInvoiceDto,
): Prisma.InvoiceUncheckedCreateInput {
  const amountPaid = new Prisma.Decimal(0);
  const commonFields = buildInvoiceCommonFields(order, dto, amountPaid);

  return {
    organizationId,
    supplierId: order.supplierId,
    supplierOrderId: order.id,
    ...commonFields,
  };
}

function buildUpdateInvoiceData(
  order: Pick<SupplierOrderWithRelations, 'supplierId' | 'currencyCode'>,
  dto: UpdateSupplierOrderInvoiceDto,
  amountPaid: Prisma.Decimal,
): Prisma.InvoiceUncheckedUpdateInput {
  return {
    supplierId: order.supplierId,
    ...buildInvoiceCommonFields(order, dto, amountPaid),
  };
}

function buildInvoiceCommonFields(
  order: Pick<SupplierOrderWithRelations, 'currencyCode'>,
  dto: CreateSupplierOrderInvoiceDto | UpdateSupplierOrderInvoiceDto,
  amountPaid: Prisma.Decimal,
): {
  invoiceNumber: string;
  direction: 'payable';
  invoiceType: (typeof dto)['invoiceType'];
  status: (typeof dto)['status'];
  issueDate: Date | null;
  dueDate: Date | null;
  currencyCode: string;
  subtotalAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  amountPaid: Prisma.Decimal;
  balanceDue: Prisma.Decimal;
  notes: string | null;
} {
  const subtotalAmount = new Prisma.Decimal(dto.subtotalAmount);
  const taxAmount = new Prisma.Decimal(dto.taxAmount);
  const totalAmount = subtotalAmount.add(taxAmount);

  return {
    invoiceNumber: dto.invoiceNumber,
    direction: 'payable',
    invoiceType: dto.invoiceType,
    status: dto.status,
    issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    currencyCode: order.currencyCode,
    subtotalAmount,
    taxAmount,
    totalAmount,
    amountPaid,
    balanceDue: totalAmount.sub(amountPaid),
    notes: dto.notes ?? null,
  };
}

function translateInvoiceWriteError(error: unknown): Error {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return new BadRequestException('Invoice number already exists');
  }

  if (error instanceof Error) {
    return error;
  }

  return new BadRequestException('Could not save supplier order invoice');
}

function assertNoNewLineReferences(
  line: NonNullable<UpdateSupplierOrderDto['orderLines']>[number],
): void {
  if (
    line.supplierQuoteLineId !== undefined &&
    line.supplierQuoteLineId !== null
  ) {
    throw new BadRequestException(
      'New supplier order lines cannot set supplierQuoteLineId',
    );
  }
  if (line.houseModelId !== undefined && line.houseModelId !== null) {
    throw new BadRequestException(
      'New supplier order lines cannot set houseModelId',
    );
  }
  if (
    line.productConfigurationId !== undefined &&
    line.productConfigurationId !== null
  ) {
    throw new BadRequestException(
      'New supplier order lines cannot set productConfigurationId',
    );
  }
}

function assertExistingLineReferencesMatch(
  existingLine: {
    supplierQuoteLineId: bigint | null;
    houseModelId: bigint | null;
    productConfigurationId: bigint | null;
  },
  line: NonNullable<UpdateSupplierOrderDto['orderLines']>[number],
): void {
  assertReferenceMatches(
    line.supplierQuoteLineId,
    existingLine.supplierQuoteLineId,
    'supplierQuoteLineId',
  );
  assertReferenceMatches(
    line.houseModelId,
    existingLine.houseModelId,
    'houseModelId',
  );
  assertReferenceMatches(
    line.productConfigurationId,
    existingLine.productConfigurationId,
    'productConfigurationId',
  );
}

function assertReferenceMatches(
  providedValue: string | null | undefined,
  existingValue: bigint | null,
  fieldName: 'supplierQuoteLineId' | 'houseModelId' | 'productConfigurationId',
): void {
  if (providedValue === undefined) {
    return;
  }

  const parsedProvidedValue =
    providedValue === null ? null : parseBigIntId(providedValue, fieldName);
  if (parsedProvidedValue !== existingValue) {
    throw new BadRequestException(
      `${fieldName} cannot be changed through supplier order line updates`,
    );
  }
}

function buildSupplierOrderWhere(
  organizationId: bigint,
  query: SupplierOrderFilterDto,
): Prisma.SupplierOrderWhereInput {
  const andClauses: Prisma.SupplierOrderWhereInput[] = [];

  const persistedStatuses = query.status
    ?.flatMap((status) => STATUS_MAP[status])
    .filter(Boolean);
  if (persistedStatuses && persistedStatuses.length > 0) {
    andClauses.push({
      status: { in: persistedStatuses },
    });
  }

  if (query.supplierIds?.length) {
    andClauses.push({
      supplierId: {
        in: query.supplierIds.map((id) => parseBigIntId(id, 'supplierId')),
      },
    });
  }

  if (query.createdFrom || query.createdTo) {
    andClauses.push({
      createdAt: {
        ...(query.createdFrom ? { gte: startOfUtcDay(query.createdFrom) } : {}),
        ...(query.createdTo ? { lte: endOfUtcDay(query.createdTo) } : {}),
      },
    });
  }

  const search = query.search?.trim();
  if (search) {
    const parsedNumeric = Number.parseInt(search, 10);
    const hasNumericSearch = Number.isSafeInteger(parsedNumeric);

    andClauses.push({
      OR: [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { supplierPoNumber: { contains: search, mode: 'insensitive' } },
        ...(hasNumericSearch ? [{ id: BigInt(parsedNumeric) }] : []),
      ],
    });
  }

  return {
    organizationId,
    ...(andClauses.length > 0 ? { AND: andClauses } : {}),
  };
}

function getSafeOrderBy(
  query: SupplierOrderFilterDto,
): Prisma.SupplierOrderOrderByWithRelationInput[] {
  const direction = query.sortCriteria === 'asc' ? 'asc' : 'desc';

  switch (query.sortField) {
    case 'id':
      return [{ id: direction }];
    case 'status':
      return [{ status: direction }, { id: 'asc' }];
    case 'supplier.name':
      return [{ supplier: { name: direction } }, { id: 'asc' }];
    case 'createdAt':
    default:
      return [{ createdAt: direction }, { id: 'asc' }];
  }
}

function startOfUtcDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfUtcDay(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

function formatOrderNumber(value: bigint): string {
  return `SO-${value.toString().padStart(6, '0')}`;
}

function isExpiredQuote(value: Date | null): boolean {
  if (!value) {
    return false;
  }

  return value.getTime() < startOfUtcToday().getTime();
}

function startOfUtcToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}
