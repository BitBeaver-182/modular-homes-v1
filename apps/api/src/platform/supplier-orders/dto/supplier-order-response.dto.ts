import type {
  SupplierOrderListInvoiceResponse as SupplierOrderListInvoiceContract,
  SupplierOrderListItemResponse as SupplierOrderListItemContract,
  SupplierOrderListMoney as SupplierOrderListMoneyContract,
  SupplierOrderListQuoteResponse as SupplierOrderListQuoteContract,
  SupplierOrderListResponse as SupplierOrderListContract,
  SupplierOrderListStatus,
} from '@moduflow/types';
import { SUPPLIER_ORDER_LIST_STATUSES } from '@moduflow/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { createPaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { SupplierResponse } from '../../suppliers/dto/supplier-response.dto';

export class SupplierOrderListMoneyResponse implements SupplierOrderListMoneyContract {
  constructor(partial: SupplierOrderListMoneyContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 12500 })
  @Expose()
  amount!: number;

  @ApiProperty({ example: 'EUR' })
  @Expose()
  currencyCode!: string;
}

export class SupplierOrderListQuoteResponse implements SupplierOrderListQuoteContract {
  constructor(partial: SupplierOrderListQuoteContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '12' })
  @Expose()
  id!: string;

  @ApiPropertyOptional({ type: SupplierResponse, nullable: true })
  @Expose()
  @Type(() => SupplierResponse)
  supplier!: SupplierResponse | null;

  @ApiPropertyOptional({
    type: SupplierOrderListMoneyResponse,
    nullable: true,
  })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  total!: SupplierOrderListMoneyResponse | null;
}

export class SupplierOrderListInvoiceResponse implements SupplierOrderListInvoiceContract {
  constructor(partial: SupplierOrderListInvoiceContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '77' })
  @Expose()
  id!: string;

  @ApiPropertyOptional({
    type: SupplierOrderListMoneyResponse,
    nullable: true,
  })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  total!: SupplierOrderListMoneyResponse | null;

  @ApiPropertyOptional({
    type: SupplierOrderListMoneyResponse,
    nullable: true,
  })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  amountPaid!: SupplierOrderListMoneyResponse | null;

  @ApiPropertyOptional({
    type: SupplierOrderListMoneyResponse,
    nullable: true,
  })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  balanceDue!: SupplierOrderListMoneyResponse | null;
}

export class SupplierOrderListItemResponse implements SupplierOrderListItemContract {
  constructor(partial: SupplierOrderListItemContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '101' })
  @Expose()
  id!: string;

  @ApiPropertyOptional({ example: 'SO-000101', nullable: true })
  @Expose()
  orderNumber!: string | null;

  @ApiProperty()
  @Expose()
  createdAt!: string;

  @ApiProperty()
  @Expose()
  updatedAt!: string;

  @ApiProperty({ enum: SUPPLIER_ORDER_LIST_STATUSES })
  @Expose()
  orderStatus!: SupplierOrderListStatus;

  @ApiPropertyOptional({ type: SupplierResponse, nullable: true })
  @Expose()
  @Type(() => SupplierResponse)
  supplier!: SupplierResponse | null;

  @ApiPropertyOptional({ type: SupplierOrderListQuoteResponse, nullable: true })
  @Expose()
  @Type(() => SupplierOrderListQuoteResponse)
  quote!: SupplierOrderListQuoteResponse | null;

  @ApiProperty({ type: SupplierOrderListInvoiceResponse, isArray: true })
  @Expose()
  @Type(() => SupplierOrderListInvoiceResponse)
  invoices!: SupplierOrderListInvoiceResponse[];
}

export class SupplierOrderListResponse
  extends createPaginatedResponseDto(SupplierOrderListItemResponse)
  implements SupplierOrderListContract {}
