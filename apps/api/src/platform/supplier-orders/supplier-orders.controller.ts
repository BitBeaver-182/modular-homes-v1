import {
  Delete,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import type { AuthenticatedActor } from '../../auth/auth.types';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { Actor } from '../actor.decorator';
import { OrganizationId } from '../organization-id.decorator';
import { platformPath } from '../platform.constants';
import { PlatformMembershipGuard } from '../platform-membership.guard';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import { ApiOrganizationHeader } from '../platform-swagger.decorator';
import { CreateSupplierOrderDto } from './dto/create-supplier-order.dto';
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
import { SupplierOrderFilterDto } from './dto/supplier-order-filter.dto';
import {
  SupplierOrderDetailInvoiceResponse,
  SupplierOrderInvoiceInstallmentResponse,
  SupplierOrderInvoicePaymentResponse,
  SupplierOrderDetailResponse,
  SupplierOrderListItemResponse,
  SupplierOrderListResponse,
} from './dto/supplier-order-response.dto';
import { UpdateSupplierOrderDto } from './dto/update-supplier-order.dto';
import {
  toSupplierOrderListItemResponse,
  toSupplierOrderListResponse,
} from './mappers/supplier-order.mapper';
import { SupplierOrdersService } from './supplier-orders.service';

@ApiTags('Supplier Orders')
@ApiOrganizationHeader()
@UseGuards(JwtGuard, PlatformOrganizationContextGuard, PlatformMembershipGuard)
@Controller(platformPath('supplier-orders'))
export class SupplierOrdersController {
  constructor(private readonly supplierOrdersService: SupplierOrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Supplier Order',
    description:
      'Create a supplier order from an accepted quote in the active organization.',
  })
  @ApiCreatedResponse({ type: SupplierOrderListItemResponse })
  async create(
    @Actor() actor: AuthenticatedActor,
    @Body() dto: CreateSupplierOrderDto,
  ): Promise<SupplierOrderListItemResponse> {
    return plainToInstance(
      SupplierOrderListItemResponse,
      toSupplierOrderListItemResponse(
        await this.supplierOrdersService.create(actor, dto),
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List Supplier Orders',
    description: 'Return supplier orders in the active organization.',
  })
  @ApiOkResponse({ type: SupplierOrderListResponse })
  async findAll(
    @OrganizationId() organizationId: bigint,
    @Query() query: SupplierOrderFilterDto,
  ): Promise<SupplierOrderListResponse> {
    const result = await this.supplierOrdersService.findAll(
      organizationId,
      query,
    );

    return plainToInstance(
      SupplierOrderListResponse,
      toSupplierOrderListResponse(result.data, result.meta),
      { excludeExtraneousValues: true },
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Supplier Order',
    description:
      'Return a supplier order detail view in the active organization.',
  })
  @ApiOkResponse({ type: SupplierOrderDetailResponse })
  async findOne(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ): Promise<SupplierOrderDetailResponse> {
    return plainToInstance(
      SupplierOrderDetailResponse,
      await this.supplierOrdersService.findOneResponse(organizationId, id),
      { excludeExtraneousValues: true },
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Supplier Order',
    description:
      'Update editable supplier-order fields in the active organization.',
  })
  @ApiOkResponse({ type: SupplierOrderDetailResponse })
  async update(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierOrderDto,
  ): Promise<SupplierOrderDetailResponse> {
    await this.supplierOrdersService.update(organizationId, id, dto);

    return plainToInstance(
      SupplierOrderDetailResponse,
      await this.supplierOrdersService.findOneResponse(organizationId, id),
      { excludeExtraneousValues: true },
    );
  }

  @Post(':id/invoices')
  @ApiOperation({
    summary: 'Create Supplier Order Invoice',
    description:
      'Create an invoice for a supplier order in the active organization.',
  })
  @ApiCreatedResponse({ type: SupplierOrderDetailInvoiceResponse })
  async createInvoice(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Body() dto: CreateSupplierOrderInvoiceDto,
  ): Promise<SupplierOrderDetailInvoiceResponse> {
    return plainToInstance(
      SupplierOrderDetailInvoiceResponse,
      await this.supplierOrdersService.createInvoiceResponse(
        organizationId,
        id,
        dto,
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Patch(':id/invoices/:invoiceId')
  @ApiOperation({
    summary: 'Update Supplier Order Invoice',
    description:
      'Update an invoice for a supplier order in the active organization.',
  })
  @ApiOkResponse({ type: SupplierOrderDetailInvoiceResponse })
  async updateInvoice(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: UpdateSupplierOrderInvoiceDto,
  ): Promise<SupplierOrderDetailInvoiceResponse> {
    return plainToInstance(
      SupplierOrderDetailInvoiceResponse,
      await this.supplierOrdersService.updateInvoiceResponse(
        organizationId,
        id,
        invoiceId,
        dto,
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Delete(':id/invoices/:invoiceId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete Supplier Order Invoice',
    description:
      'Delete an invoice for a supplier order in the active organization.',
  })
  @ApiNoContentResponse()
  async deleteInvoice(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
  ): Promise<void> {
    await this.supplierOrdersService.deleteInvoice(
      organizationId,
      id,
      invoiceId,
    );
  }

  @Post(':id/invoices/:invoiceId/installments')
  @ApiOperation({
    summary: 'Create Supplier Order Invoice Installment',
    description:
      'Create an installment for an invoice on a supplier order in the active organization.',
  })
  @ApiCreatedResponse({ type: SupplierOrderInvoiceInstallmentResponse })
  async createInstallment(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreateSupplierOrderInvoiceInstallmentDto,
  ): Promise<SupplierOrderInvoiceInstallmentResponse> {
    return plainToInstance(
      SupplierOrderInvoiceInstallmentResponse,
      await this.supplierOrdersService.createInstallmentResponse(
        organizationId,
        id,
        invoiceId,
        dto,
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Patch(':id/invoices/:invoiceId/installments/:installmentId')
  @ApiOperation({
    summary: 'Update Supplier Order Invoice Installment',
    description:
      'Update an installment for an invoice on a supplier order in the active organization.',
  })
  @ApiOkResponse({ type: SupplierOrderInvoiceInstallmentResponse })
  async updateInstallment(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Param('installmentId') installmentId: string,
    @Body() dto: UpdateSupplierOrderInvoiceInstallmentDto,
  ): Promise<SupplierOrderInvoiceInstallmentResponse> {
    return plainToInstance(
      SupplierOrderInvoiceInstallmentResponse,
      await this.supplierOrdersService.updateInstallmentResponse(
        organizationId,
        id,
        invoiceId,
        installmentId,
        dto,
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Delete(':id/invoices/:invoiceId/installments/:installmentId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete Supplier Order Invoice Installment',
    description:
      'Delete an installment for an invoice on a supplier order in the active organization.',
  })
  @ApiNoContentResponse()
  async deleteInstallment(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Param('installmentId') installmentId: string,
  ): Promise<void> {
    await this.supplierOrdersService.deleteInstallment(
      organizationId,
      id,
      invoiceId,
      installmentId,
    );
  }

  @Post(':id/invoices/:invoiceId/payments')
  @ApiOperation({
    summary: 'Create Supplier Order Invoice Payment',
    description:
      'Record a payment for an invoice on a supplier order in the active organization.',
  })
  @ApiCreatedResponse({ type: SupplierOrderInvoicePaymentResponse })
  async createPayment(
    @OrganizationId() organizationId: bigint,
    @Actor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreateSupplierOrderInvoicePaymentDto,
  ): Promise<SupplierOrderInvoicePaymentResponse> {
    return plainToInstance(
      SupplierOrderInvoicePaymentResponse,
      await this.supplierOrdersService.createPaymentResponse(
        actor,
        organizationId,
        id,
        invoiceId,
        dto,
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Patch(':id/invoices/:invoiceId/payments/:paymentId')
  @ApiOperation({
    summary: 'Update Supplier Order Invoice Payment',
    description:
      'Update a recorded payment for an invoice on a supplier order in the active organization.',
  })
  @ApiOkResponse({ type: SupplierOrderInvoicePaymentResponse })
  async updatePayment(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateSupplierOrderInvoicePaymentDto,
  ): Promise<SupplierOrderInvoicePaymentResponse> {
    return plainToInstance(
      SupplierOrderInvoicePaymentResponse,
      await this.supplierOrdersService.updatePaymentResponse(
        organizationId,
        id,
        invoiceId,
        paymentId,
        dto,
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Delete(':id/invoices/:invoiceId/payments/:paymentId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete Supplier Order Invoice Payment',
    description:
      'Delete a recorded payment for an invoice on a supplier order in the active organization.',
  })
  @ApiNoContentResponse()
  async deletePayment(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Param('paymentId') paymentId: string,
  ): Promise<void> {
    await this.supplierOrdersService.deletePayment(
      organizationId,
      id,
      invoiceId,
      paymentId,
    );
  }
}
