import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { deleteSupplierInvoice } from "../lib/order-api";
import { orderKeys } from "../../supplier-orders/hooks/order-keys";

export type DeleteOrderInvoiceVariables = {
	orderDocumentId: string;
	invoiceDocumentId: string;
};

export const useDeleteOrderInvoice = (): UseMutationResult<
	void,
	Error,
	DeleteOrderInvoiceVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ invoiceDocumentId }: DeleteOrderInvoiceVariables) =>
			deleteSupplierInvoice(invoiceDocumentId),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: orderKeys.detail(variables.orderDocumentId),
				}),
			]);
		},
	});
};
