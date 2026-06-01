import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";

export const orderKeys = {
	all: ["supplier-orders"] as const,
	lists: () => [...orderKeys.all, "list"] as const,
	list: (parameters: SupplierOrdersSearchParameters) =>
		[...orderKeys.lists(), parameters] as const,
	details: () => [...orderKeys.all, "detail"] as const,
	detail: (orderId: string, organizationId?: string) =>
		organizationId
			? [...orderKeys.details(), orderId, { organizationId }] as const
			: [...orderKeys.details(), orderId] as const,
};
