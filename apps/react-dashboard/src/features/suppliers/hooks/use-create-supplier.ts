import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { createSupplier } from "../lib/supplier-api";
import type { Supplier, SupplierWriteInput } from "../types";
import { supplierKeys } from "./supplier-keys";

export const useCreateSupplier = (): UseMutationResult<
	Supplier,
	Error,
	SupplierWriteInput
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: SupplierWriteInput) => createSupplier(input),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
		},
	});
};
