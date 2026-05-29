import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { QuerybuilderService } from 'nestjs-prisma-querybuilder';
import { PrismaService } from '../../database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

const SORT_FIELDS = ['createdAt', 'name', 'email', 'phoneNumber'] as const;
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

type SupplierSortField = (typeof SORT_FIELDS)[number];
type SupplierQuery = Record<string, unknown>;
type SupplierWriteData = Pick<
  Prisma.SupplierUncheckedCreateInput,
  | 'name'
  | 'phoneNumber'
  | 'email'
  | 'addressFull'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'region'
  | 'postalCode'
  | 'countryCode'
  | 'website'
>;

export interface ListSuppliersResult {
  data: Awaited<ReturnType<SuppliersService['findOne']>>[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly querybuilder: QuerybuilderService<PrismaService>,
  ) {}

  async create(organizationId: bigint, createSupplierDto: CreateSupplierDto) {
    const data = sanitizeWriteInput(createSupplierDto) as SupplierWriteData & {
      name: string;
    };
    await this.assertNameAvailable(organizationId, data.name);

    try {
      return await this.prisma.supplier.create({
        data: {
          organizationId,
          ...data,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throwSupplierNameTaken();
      }
      throw error;
    }
  }

  async findAll(
    organizationId: bigint,
    query: SupplierQuery,
  ): Promise<ListSuppliersResult> {
    assertSupportedQuery(query);

    const builtQuery = await this.querybuilder.query({
      model: 'supplier',
      paginationOnly: true,
      setHeaders: false,
    });

    const take = toPositiveNumber(builtQuery.take, 10);
    const skip = toNonNegativeNumber(builtQuery.skip, 0);
    const page = Math.floor(skip / take) + 1;
    const orderBy = getSafeOrderBy(builtQuery.orderBy);
    const where = buildSupplierWhere(organizationId, query);

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.supplier.count({ where }),
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

  async findOne(organizationId: bigint, id: bigint) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(
    organizationId: bigint,
    id: bigint,
    updateSupplierDto: UpdateSupplierDto,
  ) {
    await this.findOne(organizationId, id);
    const data = sanitizeWriteInput(updateSupplierDto);

    if (typeof data.name === 'string') {
      await this.assertNameAvailable(organizationId, data.name, id);
    }

    try {
      return await this.prisma.supplier.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throwSupplierNameTaken();
      }
      throw error;
    }
  }

  async remove(organizationId: bigint, id: bigint) {
    await this.findOne(organizationId, id);

    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertNameAvailable(
    organizationId: bigint,
    name: string,
    currentSupplierId?: bigint,
  ): Promise<void> {
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...(currentSupplierId ? { id: { not: currentSupplierId } } : {}),
      },
      select: { id: true },
    });

    if (existingSupplier) {
      throwSupplierNameTaken();
    }
  }
}

function throwSupplierNameTaken(): never {
  throw new BadRequestException({
    message: ['name must be unique inside the active organization'],
    error: 'Bad Request',
    statusCode: 400,
  });
}

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function sanitizeWriteInput(
  input: CreateSupplierDto | UpdateSupplierDto,
): Partial<SupplierWriteData> {
  const data: Partial<SupplierWriteData> = {};

  if ('name' in input && input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException('Supplier name is required');
    }
    data.name = name;
  }

  for (const field of ['phoneNumber', 'email', 'website'] as const) {
    if (field in input && input[field] !== undefined) {
      const value = input[field]?.trim();
      data[field] = value ? value : null;
    }
  }

  if ('address' in input && input.address !== undefined) {
    data.addressFull = normalizeOptionalString(input.address?.fullAddress);
    data.addressLine1 = normalizeOptionalString(input.address?.line1);
    data.addressLine2 = normalizeOptionalString(input.address?.line2);
    data.city = normalizeOptionalString(input.address?.city);
    data.region = normalizeOptionalString(input.address?.region);
    data.postalCode = normalizeOptionalString(input.address?.postalCode);
    data.countryCode = normalizeOptionalString(
      input.address?.countryCode,
    )?.toUpperCase();
  }

  return data;
}

function normalizeOptionalString(value: string | undefined): string | null {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function buildSupplierWhere(
  organizationId: bigint,
  query: SupplierQuery,
): Prisma.SupplierWhereInput {
  const search = getStringValue(query.search)?.trim();
  const where: Prisma.SupplierWhereInput = {
    organizationId,
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      'name',
      'email',
      'phoneNumber',
      'addressFull',
      'addressLine1',
      'addressLine2',
      'city',
      'region',
      'postalCode',
      'countryCode',
      'website',
    ].map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive',
      },
    }));
  }

  return where;
}

function assertSupportedQuery(query: SupplierQuery): void {
  for (const key of Object.keys(query)) {
    if (isBlockedQueryKey(key) || hasBlockedNestedQueryKey(key)) {
      throw new BadRequestException(
        `Unsupported supplier query parameter: ${key}`,
      );
    }

    if (!isAllowedQueryKey(key)) {
      throw new BadRequestException(
        `Unsupported supplier query parameter: ${key}`,
      );
    }
  }

  assertSafeSort(query);
}

function isAllowedQueryKey(key: string): boolean {
  return (
    key === 'page' ||
    key === 'limit' ||
    key === 'search' ||
    key === 'sort' ||
    key === 'sort[field]' ||
    key === 'sort[criteria]'
  );
}

function isBlockedQueryKey(key: string): boolean {
  return (BLOCKED_QUERY_KEYS as ReadonlyArray<string>).includes(key);
}

function hasBlockedNestedQueryKey(key: string): boolean {
  return BLOCKED_QUERY_KEYS.some((blockedKey) =>
    key.startsWith(`${blockedKey}[`),
  );
}

function assertSafeSort(query: SupplierQuery): void {
  const flatField = getStringValue(query['sort[field]']);
  const flatCriteria = getStringValue(query['sort[criteria]']);
  const nestedSort = query.sort;

  if (Array.isArray(nestedSort)) {
    throw new BadRequestException('Only one supplier sort field is supported');
  }

  if (nestedSort !== undefined && !isPlainObject(nestedSort)) {
    throw new BadRequestException('Invalid supplier sort parameter');
  }

  if (isPlainObject(nestedSort)) {
    for (const key of Object.keys(nestedSort)) {
      if (key !== 'field' && key !== 'criteria') {
        throw new BadRequestException(
          `Unsupported supplier sort parameter: ${key}`,
        );
      }
    }
  }

  const field = flatField ?? getStringValue(nestedSort?.field);
  const criteria = flatCriteria ?? getStringValue(nestedSort?.criteria);

  if (field && !isSupplierSortField(field)) {
    throw new BadRequestException(`Unsupported supplier sort field: ${field}`);
  }

  if (criteria && criteria !== 'asc' && criteria !== 'desc') {
    throw new BadRequestException('Supplier sort criteria must be asc or desc');
  }
}

function getSafeOrderBy(
  rawOrderBy: unknown,
): Prisma.SupplierOrderByWithRelationInput[] {
  if (rawOrderBy == null) {
    return [{ name: 'asc' }, { id: 'asc' }];
  }

  const orderItems = Array.isArray(rawOrderBy) ? rawOrderBy : [rawOrderBy];
  const safeOrderBy = orderItems.map((item) => {
    if (!isPlainObject(item)) {
      throw new BadRequestException('Invalid supplier sort parameter');
    }

    const entries = Object.entries(item);
    if (entries.length !== 1) {
      throw new BadRequestException(
        'Only one field is allowed per supplier sort',
      );
    }

    const [[field, direction]] = entries;
    if (!isSupplierSortField(field)) {
      throw new BadRequestException(
        `Unsupported supplier sort field: ${field}`,
      );
    }

    if (direction !== 'asc' && direction !== 'desc') {
      throw new BadRequestException(
        'Supplier sort criteria must be asc or desc',
      );
    }

    return { [field]: direction };
  });

  return [...safeOrderBy, { id: 'asc' }];
}

function isSupplierSortField(field: string): field is SupplierSortField {
  return (SORT_FIELDS as ReadonlyArray<string>).includes(field);
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
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
