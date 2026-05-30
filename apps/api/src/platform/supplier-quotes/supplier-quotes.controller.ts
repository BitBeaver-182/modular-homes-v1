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
import type { AuthenticatedActor } from '../../auth/auth.types';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { parseBigIntId } from '../../common/ids/parse-bigint-id';
import { Actor } from '../actor.decorator';
import { OrganizationId } from '../organization-id.decorator';
import { platformPath } from '../platform.constants';
import { PlatformMembershipGuard } from '../platform-membership.guard';
import { PlatformOrganizationContextGuard } from '../platform-organization-context.guard';
import {
  ApiBigIntIdParam,
  ApiOrganizationHeader,
} from '../platform-swagger.decorator';
import { CreateSupplierQuoteDto } from './dto/create-supplier-quote.dto';
import {
  SupplierQuoteListResponse,
  SupplierQuoteResponse,
} from './dto/supplier-quote-response.dto';
import { UpdateSupplierQuoteDto } from './dto/update-supplier-quote.dto';
import {
  toSupplierQuoteListResponse,
  toSupplierQuoteResponse,
} from './mappers/supplier-quote.mapper';
import { SupplierQuotesService } from './supplier-quotes.service';

@ApiTags('Supplier Quotes')
@ApiOrganizationHeader()
@UseGuards(JwtGuard, PlatformOrganizationContextGuard, PlatformMembershipGuard)
@Controller(platformPath('supplier-quotes'))
export class SupplierQuotesController {
  constructor(private readonly supplierQuotesService: SupplierQuotesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Supplier Quote',
    description: 'Create a supplier quote in the active organization.',
  })
  @ApiCreatedResponse({ type: SupplierQuoteResponse })
  async create(
    @Actor() actor: AuthenticatedActor,
    @Body() dto: CreateSupplierQuoteDto,
  ): Promise<SupplierQuoteResponse> {
    return plainToInstance(
      SupplierQuoteResponse,
      await toSupplierQuoteResponse(
        await this.supplierQuotesService.create(actor, dto),
        this.supplierQuotesService.getStorageService(),
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List Supplier Quotes',
    description: 'Return supplier quotes in the active organization.',
  })
  @ApiOkResponse({ type: SupplierQuoteListResponse })
  async findAll(
    @OrganizationId() organizationId: bigint,
    @Query() query: Record<string, unknown>,
  ): Promise<SupplierQuoteListResponse> {
    const result = await this.supplierQuotesService.findAll(
      organizationId,
      query,
    );

    return plainToInstance(
      SupplierQuoteListResponse,
      await toSupplierQuoteListResponse(
        result.data,
        result.meta,
        this.supplierQuotesService.getStorageService(),
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Supplier Quote',
    description: 'Return a single supplier quote in the active organization.',
  })
  @ApiBigIntIdParam('id', 'supplier quote')
  @ApiOkResponse({ type: SupplierQuoteResponse })
  async findOne(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ): Promise<SupplierQuoteResponse> {
    return plainToInstance(
      SupplierQuoteResponse,
      await toSupplierQuoteResponse(
        await this.supplierQuotesService.findOne(
          organizationId,
          parseBigIntId(id, 'supplierQuoteId'),
        ),
        this.supplierQuotesService.getStorageService(),
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Supplier Quote',
    description: 'Update a supplier quote in the active organization.',
  })
  @ApiBigIntIdParam('id', 'supplier quote')
  @ApiOkResponse({ type: SupplierQuoteResponse })
  async update(
    @Actor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierQuoteDto,
  ): Promise<SupplierQuoteResponse> {
    return plainToInstance(
      SupplierQuoteResponse,
      await toSupplierQuoteResponse(
        await this.supplierQuotesService.update(
          actor,
          parseBigIntId(id, 'supplierQuoteId'),
          dto,
        ),
        this.supplierQuotesService.getStorageService(),
      ),
      { excludeExtraneousValues: true },
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete Supplier Quote',
    description: 'Soft-delete a supplier quote in the active organization.',
  })
  @ApiBigIntIdParam('id', 'supplier quote')
  @ApiNoContentResponse()
  async remove(
    @OrganizationId() organizationId: bigint,
    @Param('id') id: string,
  ): Promise<void> {
    await this.supplierQuotesService.remove(
      organizationId,
      parseBigIntId(id, 'supplierQuoteId'),
    );
  }
}
