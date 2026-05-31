import { SUPPLIER_ORDER_LIST_STATUSES } from "@moduflow/types";

export const SUPPLIER_ORDER_STATUSES = SUPPLIER_ORDER_LIST_STATUSES;

export const SUPPLIER_ORDER_SORT_FIELDS = [
	"id",
	"createdAt",
	"orderStatus",
	"supplier.name",
] as const;

export type SupplierOrderSortField = (typeof SUPPLIER_ORDER_SORT_FIELDS)[number];
