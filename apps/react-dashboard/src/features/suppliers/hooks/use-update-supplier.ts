import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { supplierKeys } from "./supplier-keys";
import { updateSupplier } from "../lib/supplier-api";

import type { Supplier, SupplierWriteInput } from "../types";

export interface UpdateSupplierVariables {
	id: string;
	input: SupplierWriteInput;
}

export const useUpdateSupplier = (
	organizationId: string
): UseMutationResult<
	Supplier,
	Error,
	UpdateSupplierVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: UpdateSupplierVariables) =>
			updateSupplier({ organizationId }, id, input),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: supplierKeys.lists(organizationId),
				}),
				queryClient.invalidateQueries({
					queryKey: supplierKeys.detail(organizationId, variables.id),
				}),
			]);
		},
	});
};
