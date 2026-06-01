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
import { SupplierOrderFilterDto } from './dto/supplier-order-filter.dto';
import {
  SupplierOrderDetailInvoiceResponse,
  SupplierOrderDetailResponse,
  SupplierOrderListItemResponse,
  SupplierOrderListResponse,
} from './dto/supplier-order-response.dto';
import { UpdateSupplierOrderDto } from './dto/update-supplier-order.dto';
import {
  toSupplierOrderDetailInvoiceResponse,
  toSupplierOrderDetailResponse,
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
      toSupplierOrderDetailResponse(
        await this.supplierOrdersService.findOne(organizationId, id),
      ),
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
    return plainToInstance(
      SupplierOrderDetailResponse,
      toSupplierOrderDetailResponse(
        await this.supplierOrdersService.update(organizationId, id, dto),
      ),
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
      toSupplierOrderDetailInvoiceResponse(
        await this.supplierOrdersService.createInvoice(organizationId, id, dto),
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
      toSupplierOrderDetailInvoiceResponse(
        await this.supplierOrdersService.updateInvoice(
          organizationId,
          id,
          invoiceId,
          dto,
        ),
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
}
