import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

export const quoteKeys = {
	all: ["quotes"] as const,
	lists: (organizationId: string) =>
		[...quoteKeys.all, organizationId, "list"] as const,
	list: (organizationId: string, params: QuotesQueryParams) =>
		[...quoteKeys.lists(organizationId), params] as const,
	details: () => [...quoteKeys.all, "detail"] as const,
	detail: (id: string) => [...quoteKeys.details(), id] as const,
};
