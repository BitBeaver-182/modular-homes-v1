import type {
  SupplierOrderDetailInvoiceResponse as SupplierOrderDetailInvoiceContract,
  SupplierOrderDetailLineResponse as SupplierOrderDetailLineContract,
  SupplierOrderDetailQuoteResponse as SupplierOrderDetailQuoteContract,
  SupplierOrderDetailResponse as SupplierOrderDetailContract,
  SupplierOrderDetailStatus,
  SupplierOrderInvoiceDirection,
  SupplierOrderInvoiceStatus,
  SupplierOrderInvoiceType,
  SupplierOrderListInvoiceResponse as SupplierOrderListInvoiceContract,
  SupplierOrderListItemResponse as SupplierOrderListItemContract,
  SupplierOrderListMoney as SupplierOrderListMoneyContract,
  SupplierOrderListQuoteResponse as SupplierOrderListQuoteContract,
  SupplierOrderListResponse as SupplierOrderListContract,
  SupplierOrderListStatus,
} from '@moduflow/types';
import {
  SUPPLIER_ORDER_DETAIL_STATUSES,
  SUPPLIER_ORDER_INVOICE_DIRECTIONS,
  SUPPLIER_ORDER_INVOICE_STATUSES,
  SUPPLIER_ORDER_INVOICE_TYPES,
  SUPPLIER_ORDER_LIST_STATUSES,
} from '@moduflow/types';
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

export class SupplierOrderDetailQuoteResponse implements SupplierOrderDetailQuoteContract {
  constructor(partial: SupplierOrderDetailQuoteContract) {
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

  @ApiPropertyOptional({ example: 'Q-2026-001', nullable: true })
  @Expose()
  quoteNumber!: string | null;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z', nullable: true })
  @Expose()
  quoteDate!: string | null;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z', nullable: true })
  @Expose()
  validUntil!: string | null;

  @ApiPropertyOptional({ example: 'Net 30', nullable: true })
  @Expose()
  paymentTerms!: string | null;
}

export class SupplierOrderDetailLineResponse implements SupplierOrderDetailLineContract {
  constructor(partial: SupplierOrderDetailLineContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '91' })
  @Expose()
  id!: string;

  @ApiPropertyOptional({ example: '45', nullable: true })
  @Expose()
  supplierQuoteLineId!: string | null;

  @ApiPropertyOptional({ example: '15', nullable: true })
  @Expose()
  houseModelId!: string | null;

  @ApiPropertyOptional({ example: '19', nullable: true })
  @Expose()
  productConfigurationId!: string | null;

  @ApiPropertyOptional({ example: 'Model A', nullable: true })
  @Expose()
  description!: string | null;

  @ApiProperty({ example: 2 })
  @Expose()
  quantity!: number;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  unitCost!: SupplierOrderListMoneyResponse;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  lineTotal!: SupplierOrderListMoneyResponse;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @Expose()
  createdAt!: string;
}

export class SupplierOrderDetailInvoiceResponse implements SupplierOrderDetailInvoiceContract {
  constructor(partial: SupplierOrderDetailInvoiceContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '77' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'INV-2026-001' })
  @Expose()
  invoiceNumber!: string;

  @ApiProperty({ enum: SUPPLIER_ORDER_INVOICE_DIRECTIONS })
  @Expose()
  direction!: SupplierOrderInvoiceDirection;

  @ApiProperty({ enum: SUPPLIER_ORDER_INVOICE_TYPES })
  @Expose()
  invoiceType!: SupplierOrderInvoiceType;

  @ApiProperty({ enum: SUPPLIER_ORDER_INVOICE_STATUSES })
  @Expose()
  status!: SupplierOrderInvoiceStatus;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z', nullable: true })
  @Expose()
  issueDate!: string | null;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z', nullable: true })
  @Expose()
  dueDate!: string | null;

  @ApiProperty({ example: 'EUR' })
  @Expose()
  currencyCode!: string;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  subtotalAmount!: SupplierOrderListMoneyResponse;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  taxAmount!: SupplierOrderListMoneyResponse;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  totalAmount!: SupplierOrderListMoneyResponse;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  amountPaid!: SupplierOrderListMoneyResponse;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  balanceDue!: SupplierOrderListMoneyResponse;

  @ApiPropertyOptional({
    example: 'Awaiting customs clearance',
    nullable: true,
  })
  @Expose()
  notes!: string | null;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @Expose()
  createdAt!: string;

  @ApiProperty({ example: '2026-06-02T00:00:00.000Z' })
  @Expose()
  updatedAt!: string;
}

export class SupplierOrderDetailResponse implements SupplierOrderDetailContract {
  constructor(partial: SupplierOrderDetailContract) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '101' })
  @Expose()
  id!: string;

  @ApiPropertyOptional({ example: 'SO-000101', nullable: true })
  @Expose()
  orderNumber!: string | null;

  @ApiPropertyOptional({ example: 'PO-2026-009', nullable: true })
  @Expose()
  supplierPoNumber!: string | null;

  @ApiProperty({ enum: SUPPLIER_ORDER_DETAIL_STATUSES })
  @Expose()
  status!: SupplierOrderDetailStatus;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z', nullable: true })
  @Expose()
  orderDate!: string | null;

  @ApiPropertyOptional({ example: '2026-06-02T00:00:00.000Z', nullable: true })
  @Expose()
  confirmedAt!: string | null;

  @ApiPropertyOptional({ example: '2026-06-10T00:00:00.000Z', nullable: true })
  @Expose()
  expectedReadyDate!: string | null;

  @ApiPropertyOptional({ example: '2026-06-15T00:00:00.000Z', nullable: true })
  @Expose()
  expectedShipDate!: string | null;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z', nullable: true })
  @Expose()
  expectedArrivalDate!: string | null;

  @ApiProperty({ example: 'EUR' })
  @Expose()
  currencyCode!: string;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  subtotalAmount!: SupplierOrderListMoneyResponse;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  shippingAmount!: SupplierOrderListMoneyResponse;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  taxAmount!: SupplierOrderListMoneyResponse;

  @ApiProperty({ type: SupplierOrderListMoneyResponse })
  @Expose()
  @Type(() => SupplierOrderListMoneyResponse)
  totalAmount!: SupplierOrderListMoneyResponse;

  @ApiPropertyOptional({ example: 'FOB', nullable: true })
  @Expose()
  incoterm!: string | null;

  @ApiPropertyOptional({ example: 'Net 30', nullable: true })
  @Expose()
  paymentTerms!: string | null;

  @ApiPropertyOptional({ example: 'Shenzhen', nullable: true })
  @Expose()
  loadingPort!: string | null;

  @ApiPropertyOptional({ example: 'Rotterdam', nullable: true })
  @Expose()
  destinationPort!: string | null;

  @ApiPropertyOptional({ example: 'Ready for booking', nullable: true })
  @Expose()
  notes!: string | null;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @Expose()
  createdAt!: string;

  @ApiProperty({ example: '2026-06-02T00:00:00.000Z' })
  @Expose()
  updatedAt!: string;

  @ApiPropertyOptional({ type: SupplierResponse, nullable: true })
  @Expose()
  @Type(() => SupplierResponse)
  supplier!: SupplierResponse | null;

  @ApiPropertyOptional({
    type: SupplierOrderDetailQuoteResponse,
    nullable: true,
  })
  @Expose()
  @Type(() => SupplierOrderDetailQuoteResponse)
  quote!: SupplierOrderDetailQuoteResponse | null;

  @ApiProperty({ type: SupplierOrderDetailLineResponse, isArray: true })
  @Expose()
  @Type(() => SupplierOrderDetailLineResponse)
  orderLines!: SupplierOrderDetailLineResponse[];

  @ApiProperty({ type: SupplierOrderDetailInvoiceResponse, isArray: true })
  @Expose()
  @Type(() => SupplierOrderDetailInvoiceResponse)
  invoices!: SupplierOrderDetailInvoiceResponse[];
}
