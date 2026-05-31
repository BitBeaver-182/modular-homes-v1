import { z } from "zod";

import {
	createSortSchema,
	createTableSchema,
	dateRangeSchema,
} from "@/common/validation-schema";
import {
	SUPPLIER_ORDER_SORT_FIELDS,
	SUPPLIER_ORDER_STATUSES,
} from "@/features/supplier-orders/list-types";

const supplierOrderStatusSchema = z.enum(SUPPLIER_ORDER_STATUSES);
const supplierOrderSortSchema = createSortSchema(SUPPLIER_ORDER_SORT_FIELDS);
const tableSchema = createTableSchema(10);

const supplierOrdersFiltersSchema = z.object({
	order_status: z.array(supplierOrderStatusSchema).optional(),
	createdAt: dateRangeSchema.optional().catch(undefined),
	supplier_ids: z.array(z.string()).optional().catch(undefined),
});

export const supplierOrdersSearchParametersSchema = z.object({
	...tableSchema.shape,
	...supplierOrdersFiltersSchema.shape,
	...supplierOrderSortSchema.shape,
});

export type SupplierOrdersSearchParameters = z.infer<
	typeof supplierOrdersSearchParametersSchema
>;
