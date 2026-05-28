import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { deleteSupplierInvoicePayment } from "../lib/order-api";
import { orderKeys } from "../../supplier-orders/hooks/order-keys";

export type DeleteInvoicePaymentVariables = {
	orderDocumentId: string;
	paymentDocumentId: string;
};

export const useDeleteInvoicePayment = (): UseMutationResult<
	void,
	Error,
	DeleteInvoicePaymentVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ paymentDocumentId }: DeleteInvoicePaymentVariables) =>
			deleteSupplierInvoicePayment(paymentDocumentId),
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
