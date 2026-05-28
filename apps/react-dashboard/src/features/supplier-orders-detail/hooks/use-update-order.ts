import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	updateSupplierOrder,
	type SupplierOrderWriteInput,
} from "../lib/order-api";
import type { SupplierOrder } from "../../supplier-orders/types";
import { orderKeys } from "../../supplier-orders/hooks/order-keys";

export type UpdateOrderVariables = {
	documentId: string;
	input: SupplierOrderWriteInput;
};

export const useUpdateOrder = (): UseMutationResult<
	SupplierOrder,
	Error,
	UpdateOrderVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ documentId, input }: UpdateOrderVariables) =>
			updateSupplierOrder(documentId, input),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: orderKeys.detail(variables.documentId),
				}),
			]);
		},
	});
};
