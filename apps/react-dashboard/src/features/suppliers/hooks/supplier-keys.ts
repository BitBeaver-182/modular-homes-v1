import type { SuppliersQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";

export const supplierKeys = {
	all: ["suppliers"] as const,
	organization: (organizationId: string) =>
		[...supplierKeys.all, organizationId] as const,
	lists: (organizationId: string) =>
		[...supplierKeys.organization(organizationId), "list"] as const,
	list: (organizationId: string, params: SuppliersQueryParams) =>
		[...supplierKeys.lists(organizationId), params] as const,
	details: (organizationId: string) =>
		[...supplierKeys.organization(organizationId), "detail"] as const,
	detail: (organizationId: string, id: string) =>
		[...supplierKeys.details(organizationId), id] as const,
};
