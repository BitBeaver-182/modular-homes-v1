import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { OrganizationId } from '../organization-id.decorator';
import { platformPath } from '../platform.constants';
import { PlatformMembershipGuard } from '../platform-membership.guard';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import { ApiOrganizationHeader } from '../platform-swagger.decorator';
import { SupplierOrderFilterDto } from './dto/supplier-order-filter.dto';
import { SupplierOrderListResponse } from './dto/supplier-order-response.dto';
import { toSupplierOrderListResponse } from './mappers/supplier-order.mapper';
import { SupplierOrdersService } from './supplier-orders.service';

@ApiTags('Supplier Orders')
@ApiOrganizationHeader()
@UseGuards(JwtGuard, PlatformOrganizationContextGuard, PlatformMembershipGuard)
@Controller(platformPath('supplier-orders'))
export class SupplierOrdersController {
  constructor(private readonly supplierOrdersService: SupplierOrdersService) {}

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
