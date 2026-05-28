import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { updateSupplier } from "../lib/supplier-api";
import type { Supplier, SupplierWriteInput } from "../types";
import { supplierKeys } from "./supplier-keys";

export type UpdateSupplierVariables = {
	documentId: string;
	input: SupplierWriteInput;
};

export const useUpdateSupplier = (): UseMutationResult<
	Supplier,
	Error,
	UpdateSupplierVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ documentId, input }: UpdateSupplierVariables) =>
			updateSupplier(documentId, input),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: supplierKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: supplierKeys.detail(variables.documentId),
				}),
			]);
		},
	});
};
