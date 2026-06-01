import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
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
import { SupplierOrderFilterDto } from './dto/supplier-order-filter.dto';
import {
  SupplierOrderListItemResponse,
  SupplierOrderListResponse,
} from './dto/supplier-order-response.dto';
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
}
