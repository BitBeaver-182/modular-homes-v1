import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { deleteQuote } from "../lib/quote-api";
import { quoteKeys } from "./quote-keys";

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
