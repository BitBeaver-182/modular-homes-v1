import {
  Body,
  Controller,
  Delete,
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
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { OrganizationId } from '../organization-id.decorator';
import { platformPath } from '../platform.constants';
import { PlatformMembershipGuard } from '../platform-membership.guard';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import {
  ApiBigIntIdParam,
  ApiOrganizationHeader,
} from '../platform-swagger.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import {
  SupplierListResponse,
  SupplierResponse,
} from './dto/supplier-response.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import {
  toSupplierListResponse,
  toSupplierResponse,
} from './mappers/supplier.mapper';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers')
@ApiOrganizationHeader()
@UseGuards(JwtGuard, PlatformOrganizationContextGuard, PlatformMembershipGuard)
@Controller(platformPath('suppliers'))
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Supplier',
    description: 'Create a supplier in the active organization.',
  })
  @ApiCreatedResponse({ type: SupplierResponse })
  async create(
    @OrganizationId() organizationId: bigint,
    @Body() createSupplierDto: CreateSupplierDto,
  ) {
    const supplier = await this.suppliersService.create(
      organizationId,
      createSupplierDto,
    );
    return plainToInstance(SupplierResponse, toSupplierResponse(supplier), {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List Suppliers',
    description: 'Return suppliers in the active organization.',
  })
  @ApiOkResponse({ type: SupplierListResponse })
  async findAll(
    @OrganizationId() organizationId: bigint,
    @Query() query: Record<string, unknown>,
  ): Promise<SupplierListResponse> {
    const result = await this.suppliersService.findAll(organizationId, query);

    return plainToInstance(
      SupplierListResponse,
      toSupplierListResponse(result.data, result.meta),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Supplier',
    description: 'Return a single supplier by id in the active organization.',
  })
  @ApiBigIntIdParam('id', 'supplier')
  @ApiOkResponse({ type: SupplierResponse })
  async findOne(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ) {
    const supplier = await this.suppliersService.findOne(
      organizationId,
      parseBigIntId(id, 'supplierId'),
    );
    return plainToInstance(SupplierResponse, toSupplierResponse(supplier), {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Supplier',
    description: 'Update a supplier in the active organization.',
  })
  @ApiBigIntIdParam('id', 'supplier')
  @ApiOkResponse({ type: SupplierResponse })
  async update(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    const supplier = await this.suppliersService.update(
      organizationId,
      parseBigIntId(id, 'supplierId'),
      updateSupplierDto,
    );
    return plainToInstance(SupplierResponse, toSupplierResponse(supplier), {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete Supplier',
    description: 'Soft-delete a supplier in the active organization.',
  })
  @ApiBigIntIdParam('id', 'supplier')
  @ApiNoContentResponse()
  async remove(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ): Promise<void> {
    await this.suppliersService.remove(
      organizationId,
      parseBigIntId(id, 'supplierId'),
    );
  }
}
