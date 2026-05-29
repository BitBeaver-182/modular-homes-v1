import type { SuppliersQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";

export const supplierKeys = {
	all: ["suppliers"] as const,
	lists: () => [...supplierKeys.all, "list"] as const,
	list: (params: SuppliersQueryParams) =>
		[...supplierKeys.lists(), params] as const,
	details: () => [...supplierKeys.all, "detail"] as const,
	detail: (documentId: string) =>
		[...supplierKeys.details(), documentId] as const,
};
