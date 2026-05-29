import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { supplierKeys } from "./supplier-keys";
import { deleteSupplier } from "../lib/supplier-api";

export const useDeleteSupplier = (
	organizationId: string
): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteSupplier({ organizationId }, id),
		onSuccess: async (_data, id): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: supplierKeys.lists(organizationId),
				}),
				queryClient.removeQueries({
					queryKey: supplierKeys.detail(organizationId, id),
				}),
			]);
		},
	});
};
