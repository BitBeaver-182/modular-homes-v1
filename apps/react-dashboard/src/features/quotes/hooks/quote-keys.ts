import type { QuotesQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.quotes";

export const quoteKeys = {
	all: ["quotes"] as const,
	lists: () => [...quoteKeys.all, "list"] as const,
	list: (params: QuotesQueryParams) => [...quoteKeys.lists(), params] as const,
	details: () => [...quoteKeys.all, "detail"] as const,
	detail: (documentId: string) => [...quoteKeys.details(), documentId] as const,
};
