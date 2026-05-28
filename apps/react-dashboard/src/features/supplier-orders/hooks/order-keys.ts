import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";

export const orderKeys = {
	all: ["supplier-orders"] as const,
	lists: () => [...orderKeys.all, "list"] as const,
	list: (parameters: SupplierOrdersSearchParameters) =>
		[...orderKeys.lists(), parameters] as const,
	details: () => [...orderKeys.all, "detail"] as const,
	detail: (documentId: string) => [...orderKeys.details(), documentId] as const,
};
