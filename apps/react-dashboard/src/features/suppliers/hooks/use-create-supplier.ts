import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { supplierKeys } from "./supplier-keys";
import { createSupplier } from "../lib/supplier-api";

import type { SupplierResponse, CreateSupplierRequest } from "@moduflow/types";

export const useCreateSupplier = (
	organizationId: string
): UseMutationResult<
	SupplierResponse,
	Error,
	CreateSupplierRequest
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateSupplierRequest) =>
			createSupplier({ organizationId }, input),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({
				queryKey: supplierKeys.lists(organizationId),
			});
		},
	});
};
