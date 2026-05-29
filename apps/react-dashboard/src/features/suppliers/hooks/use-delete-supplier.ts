import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { supplierKeys } from "./supplier-keys";
import { deleteSupplier } from "../lib/supplier-api";

export const useDeleteSupplier = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (documentId: string) => deleteSupplier(documentId),
		onSuccess: async (_data, documentId): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: supplierKeys.lists() }),
				queryClient.removeQueries({
					queryKey: supplierKeys.detail(documentId),
				}),
			]);
		},
	});
};
