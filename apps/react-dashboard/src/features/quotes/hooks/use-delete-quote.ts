import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { quoteKeys } from "./quote-keys";
import { deleteQuote } from "../lib/quote-api";

export const useDeleteQuote = (
	organizationId: string
): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteQuote({ organizationId }, id),
		onSuccess: async (_data, id): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: quoteKeys.lists(organizationId),
				}),
				queryClient.removeQueries({ queryKey: quoteKeys.detail(id) }),
			]);
		},
	});
};
