import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { quoteKeys } from "./quote-keys";
import { deleteQuote } from "../lib/quote-api";

export const useDeleteQuote = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (documentId: string) => deleteQuote(documentId),
		onSuccess: async (_data, documentId): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: quoteKeys.lists() }),
				queryClient.removeQueries({ queryKey: quoteKeys.detail(documentId) }),
			]);
		},
	});
};
