import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type InstallmentStatus as PersistedInstallmentStatus,
  type InvoiceStatus as PersistedInvoiceStatus,
  type SupplierOrderStatus as PersistedSupplierOrderStatus,
} from '@prisma/client';
import type { AuthenticatedActor } from '../../auth/auth.types';
import { createBadRequestException } from '../../common/errors/api-error';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { SupplierOrderFilterDto } from './dto/supplier-order-filter.dto';
import {
  CreateSupplierOrderInvoiceDto,
  UpdateSupplierOrderInvoiceDto,
} from './dto/supplier-order-invoice.dto';
import {
  CreateSupplierOrderInvoiceInstallmentDto,
  UpdateSupplierOrderInvoiceInstallmentDto,
} from './dto/supplier-order-installment.dto';
import {
  CreateSupplierOrderInvoicePaymentDto,
  UpdateSupplierOrderInvoicePaymentDto,
} from './dto/supplier-order-payment.dto';
import { UpdateSupplierOrderDto } from './dto/update-supplier-order.dto';
import {
  toSupplierOrderDetailInvoiceResponse,
  toSupplierOrderInvoiceInstallmentResponse,
  toSupplierOrderInvoicePaymentResponse,
  toSupplierOrderDetailResponse,
  type SupplierOrderInvoiceInstallmentRecord,
  type SupplierOrderInvoiceRecord,
  type SupplierOrderWithRelations,
} from './mappers/supplier-order.mapper';
import type { CreateSupplierOrderRequest } from '@moduflow/types';
import type {
  FileContext,
  SupplierOrderDetailInvoiceResponse,
  SupplierOrderInvoiceInstallmentResponse,
  SupplierOrderInvoicePaymentResponse,
  SupplierOrderDetailResponse,
} from '@moduflow/types';

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
    include: {
      attachment: true,
      installments: {
        orderBy: { installmentNumber: 'asc' },
      },
      paymentAllocations: {
        orderBy: { createdAt: 'asc' },
        include: { payment: true },
      },
    },
  },
} satisfies Prisma.SupplierOrderInclude;

const INVOICE_DETAIL_INCLUDE = {
  attachment: true,
  installments: {
    orderBy: { installmentNumber: 'asc' },
  },
  paymentAllocations: {
    orderBy: { createdAt: 'asc' },
    include: { payment: true },
  },
} satisfies Prisma.InvoiceInclude;

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

type PaymentWithAllocations = Prisma.PaymentGetPayload<{
  include: { allocations: true };
}>;

@Injectable()
export class SupplierOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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

    return this.prisma.$transaction((tx) =>
      tx.supplierOrder.create({
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
        include: INCLUDE_RELATIONS,
      }),
    );
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

  async findOneResponse(
    organizationId: bigint,
    id: string,
  ): Promise<SupplierOrderDetailResponse> {
    return toSupplierOrderDetailResponse(
      await this.findOne(organizationId, id),
      this.storageService,
    );
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
  ): Promise<SupplierOrderInvoiceRecord> {
    const order = await this.findOne(organizationId, orderId);
    await this.assertInvoiceNumberAvailable(
      organizationId,
      normalizeOptionalString(dto.invoiceNumber),
    );
    await this.assertAttachmentAvailable(organizationId, dto.attachmentId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const nextAttachmentId = normalizeOptionalString(dto.attachmentId);
        await this.claimAttachment(tx, organizationId, nextAttachmentId);

        return tx.invoice.create({
          data: buildCreateInvoiceData(organizationId, order, dto),
          include: INVOICE_DETAIL_INCLUDE,
        });
      });
    } catch (error) {
      throw translateInvoiceWriteError(error);
    }
  }

  async createInvoiceResponse(
    organizationId: bigint,
    orderId: string,
    dto: CreateSupplierOrderInvoiceDto,
  ): Promise<SupplierOrderDetailInvoiceResponse> {
    return toSupplierOrderDetailInvoiceResponse(
      await this.createInvoice(organizationId, orderId, dto),
      this.storageService,
    );
  }

  async updateInvoice(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    dto: UpdateSupplierOrderInvoiceDto,
  ): Promise<SupplierOrderInvoiceRecord> {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );
    await this.assertInvoiceNumberAvailable(
      organizationId,
      normalizeOptionalString(dto.invoiceNumber),
      invoice.id,
    );
    if (dto.attachmentId !== undefined) {
      await this.assertAttachmentAvailable(
        organizationId,
        dto.attachmentId,
        invoice.id,
      );
    }

    const previousAttachmentId = invoice.attachmentId;
    const previousAttachment = invoice.attachment;
    const nextAttachmentId =
      dto.attachmentId !== undefined
        ? normalizeOptionalString(dto.attachmentId)
        : invoice.attachmentId;

    try {
      const updatedInvoice = await this.prisma.$transaction(async (tx) => {
        if (previousAttachmentId && previousAttachmentId !== nextAttachmentId) {
          await this.retireAttachment(tx, organizationId, previousAttachmentId);
        }
        if (previousAttachmentId !== nextAttachmentId) {
          await this.claimAttachment(tx, organizationId, nextAttachmentId);
        }

        return tx.invoice.update({
          where: { id: invoice.id },
          data: buildUpdateInvoiceData(order, dto, invoice.amountPaid),
          include: INVOICE_DETAIL_INCLUDE,
        });
      });

      if (previousAttachmentId && previousAttachmentId !== nextAttachmentId) {
        void this.deleteStoredObject(organizationId, previousAttachment).catch(
          () => undefined,
        );
      }

      return updatedInvoice;
    } catch (error) {
      throw translateInvoiceWriteError(error);
    }
  }

  async updateInvoiceResponse(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    dto: UpdateSupplierOrderInvoiceDto,
  ): Promise<SupplierOrderDetailInvoiceResponse> {
    return toSupplierOrderDetailInvoiceResponse(
      await this.updateInvoice(organizationId, orderId, invoiceId, dto),
      this.storageService,
    );
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

    await this.prisma.$transaction(async (tx) => {
      if (invoice.attachmentId) {
        await this.retireAttachment(tx, organizationId, invoice.attachmentId);
      }

      await tx.invoice.delete({
        where: { id: invoice.id },
      });
    });

    void this.deleteStoredObject(organizationId, invoice.attachment).catch(
      () => undefined,
    );
  }

  async createInstallment(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    dto: CreateSupplierOrderInvoiceInstallmentDto,
  ): Promise<SupplierOrderInvoiceInstallmentRecord> {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );

    return this.prisma.$transaction(async (tx) => {
      const nextInstallmentNumber = await getNextInstallmentNumber(
        tx,
        invoice.id,
      );

      const installment = await tx.invoiceInstallment.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          installmentNumber: nextInstallmentNumber,
          dueDate: new Date(dto.dueDate),
          amountDue: new Prisma.Decimal(dto.amountDue),
          notes: normalizeOptionalString(dto.notes),
          status: deriveInstallmentStatus({
            amountDue: new Prisma.Decimal(dto.amountDue),
            amountPaid: new Prisma.Decimal(0),
            dueDate: new Date(dto.dueDate),
            paidAt: null,
          }),
        },
      });

      await this.ensureInstallmentsWithinInvoiceTotal(tx, invoice.id);

      return installment;
    });
  }

  async createInstallmentResponse(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    dto: CreateSupplierOrderInvoiceInstallmentDto,
  ): Promise<SupplierOrderInvoiceInstallmentResponse> {
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      parseBigIntId(orderId, 'id'),
      invoiceId,
    );
    return toSupplierOrderInvoiceInstallmentResponse(
      await this.createInstallment(organizationId, orderId, invoiceId, dto),
      invoice.currencyCode,
    );
  }

  async updateInstallment(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    installmentId: string,
    dto: UpdateSupplierOrderInvoiceInstallmentDto,
  ): Promise<SupplierOrderInvoiceInstallmentRecord> {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );
    const installment = await this.findInstallmentForInvoice(
      organizationId,
      invoice.id,
      installmentId,
    );

    return this.prisma.$transaction(async (tx) => {
      const amountDue = new Prisma.Decimal(dto.amountDue);
      if (installment.amountPaid.gt(amountDue)) {
        throw new BadRequestException(
          'Installment amount cannot be lower than the amount already paid',
        );
      }

      const dueDate = new Date(dto.dueDate);
      const updated = await tx.invoiceInstallment.update({
        where: { id: installment.id },
        data: {
          dueDate,
          amountDue,
          notes: normalizeOptionalString(dto.notes),
          status: deriveInstallmentStatus({
            amountDue,
            amountPaid: installment.amountPaid,
            dueDate,
            paidAt: installment.paidAt,
          }),
          paidAt: amountDue.eq(installment.amountPaid)
            ? (installment.paidAt ?? new Date())
            : installment.paidAt,
        },
      });

      await this.ensureInstallmentsWithinInvoiceTotal(
        tx,
        invoice.id,
        updated.id,
      );
      await recomputeInvoicePaymentState(tx, invoice.id);

      return updated;
    });
  }

  async updateInstallmentResponse(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    installmentId: string,
    dto: UpdateSupplierOrderInvoiceInstallmentDto,
  ): Promise<SupplierOrderInvoiceInstallmentResponse> {
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      parseBigIntId(orderId, 'id'),
      invoiceId,
    );
    return toSupplierOrderInvoiceInstallmentResponse(
      await this.updateInstallment(
        organizationId,
        orderId,
        invoiceId,
        installmentId,
        dto,
      ),
      invoice.currencyCode,
    );
  }

  async deleteInstallment(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    installmentId: string,
  ): Promise<void> {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );
    const installment = await this.findInstallmentForInvoice(
      organizationId,
      invoice.id,
      installmentId,
    );

    const allocationCount = await this.prisma.paymentAllocation.count({
      where: {
        organizationId,
        invoiceInstallmentId: installment.id,
      },
    });

    if (allocationCount > 0) {
      throw new BadRequestException(
        'Installments with allocated payments cannot be deleted',
      );
    }

    await this.prisma.invoiceInstallment.delete({
      where: { id: installment.id },
    });
  }

  async createPayment(
    actor: AuthenticatedActor,
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    dto: CreateSupplierOrderInvoicePaymentDto,
  ): Promise<PaymentWithAllocations> {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );

    return this.prisma.$transaction(async (tx) => {
      const installment = dto.invoiceInstallmentId
        ? await findInstallmentForInvoiceTx(
            tx,
            organizationId,
            invoice.id,
            dto.invoiceInstallmentId,
          )
        : null;

      const amount = new Prisma.Decimal(dto.amount);
      assertPaymentWithinBalance(invoice.balanceDue, installment, amount);
      await assertPaymentReferenceAvailable(
        tx,
        organizationId,
        normalizeOptionalString(dto.paymentReference),
      );

      const payment = await tx.payment.create({
        data: {
          organizationId,
          paymentReference: normalizeOptionalString(dto.paymentReference),
          direction: invoice.direction,
          status: 'completed',
          paymentMethod: dto.paymentMethod,
          paymentDate: new Date(dto.paymentDate),
          currencyCode: invoice.currencyCode,
          amount,
          bankAccount: normalizeOptionalString(dto.bankAccount),
          transactionId: normalizeOptionalString(dto.transactionId),
          notes: normalizeOptionalString(dto.notes),
          recordedByUserId: actor.userId,
        },
      });

      await tx.paymentAllocation.create({
        data: {
          organizationId,
          allocationReference: buildAllocationReference(payment.id),
          paymentId: payment.id,
          invoiceId: invoice.id,
          invoiceInstallmentId: installment?.id ?? null,
          allocatedAmount: amount,
        },
      });

      await recomputeInvoicePaymentState(tx, invoice.id);

      return tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: { allocations: true },
      });
    });
  }

  async createPaymentResponse(
    actor: AuthenticatedActor,
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    dto: CreateSupplierOrderInvoicePaymentDto,
  ): Promise<SupplierOrderInvoicePaymentResponse> {
    const [invoice, payment] = await Promise.all([
      this.findInvoiceForOrder(
        organizationId,
        parseBigIntId(orderId, 'id'),
        invoiceId,
      ),
      this.createPayment(actor, organizationId, orderId, invoiceId, dto),
    ]);

    return toSupplierOrderInvoicePaymentResponse(
      payment,
      invoice.currencyCode,
      payment.allocations[0]?.invoiceInstallmentId ?? null,
    );
  }

  async updatePayment(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    paymentId: string,
    dto: UpdateSupplierOrderInvoicePaymentDto,
  ): Promise<PaymentWithAllocations> {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );
    const payment = await this.findPaymentForInvoice(
      organizationId,
      invoice.id,
      paymentId,
    );

    return this.prisma.$transaction(async (tx) => {
      const installment = dto.invoiceInstallmentId
        ? await findInstallmentForInvoiceTx(
            tx,
            organizationId,
            invoice.id,
            dto.invoiceInstallmentId,
          )
        : null;

      const nextAmount = new Prisma.Decimal(dto.amount);
      await assertPaymentReferenceAvailable(
        tx,
        organizationId,
        normalizeOptionalString(dto.paymentReference),
        payment.id,
      );

      const otherAllocated = invoice.amountPaid.sub(
        payment.allocations[0]?.allocatedAmount ?? new Prisma.Decimal(0),
      );
      const remainingInvoiceBalance = invoice.totalAmount.sub(otherAllocated);
      assertPaymentWithinBalance(
        remainingInvoiceBalance,
        installment,
        nextAmount,
      );

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentReference: normalizeOptionalString(dto.paymentReference),
          paymentMethod: dto.paymentMethod,
          paymentDate: new Date(dto.paymentDate),
          amount: nextAmount,
          bankAccount: normalizeOptionalString(dto.bankAccount),
          transactionId: normalizeOptionalString(dto.transactionId),
          notes: normalizeOptionalString(dto.notes),
        },
      });

      await tx.paymentAllocation.update({
        where: { id: payment.allocations[0].id },
        data: {
          invoiceInstallmentId: installment?.id ?? null,
          allocatedAmount: nextAmount,
        },
      });

      await recomputeInvoicePaymentState(tx, invoice.id);

      return tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: { allocations: true },
      });
    });
  }

  async updatePaymentResponse(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    paymentId: string,
    dto: UpdateSupplierOrderInvoicePaymentDto,
  ): Promise<SupplierOrderInvoicePaymentResponse> {
    const [invoice, payment] = await Promise.all([
      this.findInvoiceForOrder(
        organizationId,
        parseBigIntId(orderId, 'id'),
        invoiceId,
      ),
      this.updatePayment(organizationId, orderId, invoiceId, paymentId, dto),
    ]);

    return toSupplierOrderInvoicePaymentResponse(
      payment,
      invoice.currencyCode,
      payment.allocations[0]?.invoiceInstallmentId ?? null,
    );
  }

  async deletePayment(
    organizationId: bigint,
    orderId: string,
    invoiceId: string,
    paymentId: string,
  ): Promise<void> {
    const order = await this.findOne(organizationId, orderId);
    const invoice = await this.findInvoiceForOrder(
      organizationId,
      order.id,
      invoiceId,
    );
    const payment = await this.findPaymentForInvoice(
      organizationId,
      invoice.id,
      paymentId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id: payment.id },
      });

      await recomputeInvoicePaymentState(tx, invoice.id);
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
      include: INVOICE_DETAIL_INCLUDE,
    });

    if (!invoice) {
      throw new NotFoundException('Supplier order invoice not found');
    }

    return invoice;
  }

  private async findInstallmentForInvoice(
    organizationId: bigint,
    invoiceId: bigint,
    installmentId: string,
  ): Promise<SupplierOrderInvoiceInstallmentRecord> {
    return findInstallmentForInvoiceTx(
      this.prisma,
      organizationId,
      invoiceId,
      installmentId,
    );
  }

  private async findPaymentForInvoice(
    organizationId: bigint,
    invoiceId: bigint,
    paymentId: string,
  ): Promise<PaymentWithAllocations> {
    const parsedPaymentId = parseBigIntId(paymentId, 'paymentId');
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: parsedPaymentId,
        organizationId,
        allocations: {
          some: {
            invoiceId,
          },
        },
      },
      include: { allocations: true },
    });

    if (!payment) {
      throw new NotFoundException('Supplier order invoice payment not found');
    }

    if (payment.allocations.length !== 1) {
      throw new BadRequestException(
        'Supplier order invoice payments must have exactly one allocation',
      );
    }

    return payment;
  }

  private async ensureInstallmentsWithinInvoiceTotal(
    tx: Prisma.TransactionClient,
    invoiceId: bigint,
    currentInstallmentId?: bigint,
  ): Promise<void> {
    const [invoice, installments] = await Promise.all([
      tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        select: { totalAmount: true },
      }),
      tx.invoiceInstallment.findMany({
        where: { invoiceId },
        ...(currentInstallmentId
          ? {
              orderBy: { installmentNumber: 'asc' },
            }
          : {}),
      }),
    ]);

    const totalInstallmentAmount = installments.reduce(
      (sum, installment) => sum.add(installment.amountDue),
      new Prisma.Decimal(0),
    );

    if (totalInstallmentAmount.gt(invoice.totalAmount)) {
      throw new BadRequestException(
        'Installment amounts cannot exceed the invoice total',
      );
    }
  }

  private async assertInvoiceNumberAvailable(
    organizationId: bigint,
    invoiceNumber: string | null,
    currentInvoiceId?: bigint,
  ): Promise<void> {
    if (!invoiceNumber) {
      return;
    }

    const existing = await this.prisma.invoice.findFirst({
      where: {
        organizationId,
        invoiceNumber: { equals: invoiceNumber, mode: 'insensitive' },
        ...(currentInvoiceId ? { id: { not: currentInvoiceId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Invoice number already exists');
    }
  }

  private async assertAttachmentAvailable(
    organizationId: bigint,
    attachmentId: string | null | undefined,
    currentInvoiceId?: bigint,
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
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        key: true,
        context: true,
      },
    });

    if (!upload) {
      throw new BadRequestException('Attachment must be a supplier document');
    }

    if (upload.status === 'PENDING' && isExpiredUpload(upload.expiresAt)) {
      await this.storageService.delete(upload.context, upload.key);
      await this.prisma.fileUpload.updateMany({
        where: {
          id: normalized,
          organizationId,
          status: 'PENDING',
        },
        data: { status: 'ORPHANED' },
      });
      throw new BadRequestException('Attachment upload has expired');
    }

    if (upload.status !== 'PENDING' && upload.status !== 'CONFIRMED') {
      throw new BadRequestException('Attachment must be a supplier document');
    }

    const objectExists = await this.storageService.exists(
      upload.context,
      upload.key,
    );

    if (!objectExists) {
      throw new BadRequestException('Attachment file was not uploaded');
    }

    await assertAttachmentAvailableInQuotesOrInvoices(
      this.prisma,
      organizationId,
      normalized,
      currentInvoiceId,
    );
  }

  private async retireAttachment(
    tx: Prisma.TransactionClient,
    organizationId: bigint,
    attachmentId: string | null,
  ): Promise<void> {
    if (!attachmentId) {
      return;
    }

    await tx.fileUpload.updateMany({
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

  private async claimAttachment(
    tx: Prisma.TransactionClient,
    organizationId: bigint,
    attachmentId: string | null,
  ): Promise<void> {
    if (!attachmentId) {
      return;
    }

    const { count } = await tx.fileUpload.updateMany({
      where: {
        id: attachmentId,
        organizationId,
        context: 'SUPPLIER_DOCUMENT',
        status: { in: ['PENDING', 'CONFIRMED'] },
        expiresAt: { not: null },
      },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        expiresAt: null,
      },
    });

    if (count === 0) {
      throw new BadRequestException('Attachment must be a supplier document');
    }
  }

  private async deleteStoredObject(
    organizationId: bigint,
    attachment:
      | {
          id: string;
          context: string;
          key: string;
        }
      | null
      | undefined,
  ): Promise<void> {
    if (!attachment) {
      return;
    }

    await this.storageService.delete(
      attachment.context as FileContext,
      attachment.key,
    );
    await this.prisma.fileUpload.deleteMany({
      where: {
        organizationId,
        id: attachment.id,
      },
    });
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
    attachmentId: normalizeOptionalString(dto.attachmentId),
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
    ...(dto.attachmentId !== undefined
      ? { attachmentId: normalizeOptionalString(dto.attachmentId) }
      : {}),
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

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function assertAttachmentAvailableInQuotesOrInvoices(
  prisma: PrismaService,
  organizationId: bigint,
  attachmentId: string,
  currentInvoiceId?: bigint,
): Promise<void> {
  const [existingQuote, existingInvoice] = await Promise.all([
    prisma.supplierQuote.findFirst({
      where: {
        attachmentId,
        organizationId,
        deletedAt: null,
      },
      select: { id: true },
    }),
    prisma.invoice.findFirst({
      where: {
        attachmentId,
        organizationId,
        ...(currentInvoiceId ? { id: { not: currentInvoiceId } } : {}),
      },
      select: { id: true },
    }),
  ]);

  if (existingQuote || existingInvoice) {
    throw new BadRequestException(
      'Attachment is already linked to another document',
    );
  }
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

async function findInstallmentForInvoiceTx(
  prisma: PrismaService | Prisma.TransactionClient,
  organizationId: bigint,
  invoiceId: bigint,
  installmentId: string,
): Promise<SupplierOrderInvoiceInstallmentRecord> {
  const parsedInstallmentId = parseBigIntId(
    installmentId,
    'invoiceInstallmentId',
  );
  const installment = await prisma.invoiceInstallment.findFirst({
    where: {
      id: parsedInstallmentId,
      organizationId,
      invoiceId,
    },
  });

  if (!installment) {
    throw new NotFoundException('Supplier order invoice installment not found');
  }

  return installment;
}

async function getNextInstallmentNumber(
  tx: Prisma.TransactionClient,
  invoiceId: bigint,
): Promise<number> {
  const lastInstallment = await tx.invoiceInstallment.findFirst({
    where: { invoiceId },
    orderBy: { installmentNumber: 'desc' },
    select: { installmentNumber: true },
  });

  return (lastInstallment?.installmentNumber ?? 0) + 1;
}

function deriveInstallmentStatus(input: {
  amountDue: Prisma.Decimal;
  amountPaid: Prisma.Decimal;
  dueDate: Date;
  paidAt: Date | null;
}): PersistedInstallmentStatus {
  if (input.amountPaid.gte(input.amountDue)) {
    return 'paid';
  }
  if (input.amountPaid.gt(0)) {
    return input.dueDate.getTime() < Date.now() ? 'overdue' : 'partially_paid';
  }
  return input.dueDate.getTime() < Date.now() ? 'due' : 'scheduled';
}

async function assertPaymentReferenceAvailable(
  tx: Prisma.TransactionClient,
  organizationId: bigint,
  paymentReference: string | null,
  currentPaymentId?: bigint,
): Promise<void> {
  if (!paymentReference) {
    return;
  }

  const existing = await tx.payment.findFirst({
    where: {
      organizationId,
      paymentReference: { equals: paymentReference, mode: 'insensitive' },
      ...(currentPaymentId ? { id: { not: currentPaymentId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new BadRequestException('Payment reference already exists');
  }
}

function assertPaymentWithinBalance(
  invoiceBalance: Prisma.Decimal,
  installment: {
    amountDue: Prisma.Decimal;
    amountPaid: Prisma.Decimal;
  } | null,
  amount: Prisma.Decimal,
): void {
  if (amount.gt(invoiceBalance)) {
    throw createBadRequestException(
      'Payment amount cannot exceed the invoice balance due',
      [
        {
          path: ['amount'],
          message: 'Payment amount cannot exceed the invoice balance due',
          name: 'ValidationError',
          key: 'validation.max',
          params: { max: invoiceBalance.toNumber() },
        },
      ],
    );
  }

  if (!installment) {
    return;
  }

  const installmentBalance = installment.amountDue.sub(installment.amountPaid);
  if (amount.gt(installmentBalance)) {
    throw createBadRequestException(
      'Payment amount cannot exceed the selected installment balance due',
      [
        {
          path: ['amount'],
          message:
            'Payment amount cannot exceed the selected installment balance due',
          name: 'ValidationError',
          key: 'validation.max',
          params: { max: installmentBalance.toNumber() },
        },
      ],
    );
  }
}

async function recomputeInvoicePaymentState(
  tx: Prisma.TransactionClient,
  invoiceId: bigint,
): Promise<void> {
  const invoice = await tx.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      installments: {
        orderBy: { installmentNumber: 'asc' },
      },
      paymentAllocations: true,
    },
  });

  const totalPaid = invoice.paymentAllocations.reduce(
    (sum, allocation) => sum.add(allocation.allocatedAmount),
    new Prisma.Decimal(0),
  );

  await tx.invoice.update({
    where: { id: invoice.id },
    data: {
      amountPaid: totalPaid,
      balanceDue: invoice.totalAmount.sub(totalPaid),
      status: deriveInvoiceStatus(
        invoice.status,
        invoice.totalAmount,
        totalPaid,
      ),
    },
  });

  for (const installment of invoice.installments) {
    const installmentPaid = invoice.paymentAllocations
      .filter(
        (allocation) => allocation.invoiceInstallmentId === installment.id,
      )
      .reduce(
        (sum, allocation) => sum.add(allocation.allocatedAmount),
        new Prisma.Decimal(0),
      );

    const status = deriveInstallmentStatus({
      amountDue: installment.amountDue,
      amountPaid: installmentPaid,
      dueDate: installment.dueDate,
      paidAt: installment.paidAt,
    });

    await tx.invoiceInstallment.update({
      where: { id: installment.id },
      data: {
        amountPaid: installmentPaid,
        status,
        paidAt: status === 'paid' ? (installment.paidAt ?? new Date()) : null,
      },
    });
  }
}

function deriveInvoiceStatus(
  currentStatus: PersistedInvoiceStatus,
  totalAmount: Prisma.Decimal,
  amountPaid: Prisma.Decimal,
): PersistedInvoiceStatus {
  if (currentStatus === 'cancelled' || currentStatus === 'void') {
    return currentStatus;
  }
  if (amountPaid.lte(0)) {
    return currentStatus === 'draft' ? currentStatus : 'issued';
  }
  if (amountPaid.gte(totalAmount)) {
    return 'paid';
  }
  return 'partially_paid';
}

function buildAllocationReference(paymentId: bigint): string {
  return `ALLOC-${paymentId.toString().padStart(6, '0')}`;
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

function isExpiredQuote(value: Date | null): boolean {
  if (!value) {
    return false;
  }

  return value.getTime() < startOfUtcToday().getTime();
}

function isExpiredUpload(value: Date | null): boolean {
  return value !== null && value.getTime() <= Date.now();
}

function startOfUtcToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}
