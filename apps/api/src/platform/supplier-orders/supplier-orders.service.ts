import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  Prisma,
  SupplierOrderStatus as PersistedSupplierOrderStatus,
} from '@prisma/client';
import type { AuthenticatedActor } from '../../auth/auth.types';
import { PrismaService } from '../../database/prisma.service';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { SupplierOrderFilterDto } from './dto/supplier-order-filter.dto';
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
