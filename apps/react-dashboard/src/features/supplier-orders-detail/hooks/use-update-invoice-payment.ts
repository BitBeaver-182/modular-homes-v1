import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	updateSupplierInvoicePayment,
	type SupplierInvoicePaymentUpdateInput,
} from "../lib/order-api";
import { orderKeys } from "../../supplier-orders/hooks/order-keys";

export type UpdateInvoicePaymentVariables = {
	orderDocumentId: string;
	paymentDocumentId: string;
	input: SupplierInvoicePaymentUpdateInput;
};

export const useUpdateInvoicePayment = (): UseMutationResult<
	void,
	Error,
	UpdateInvoicePaymentVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ paymentDocumentId, input }: UpdateInvoicePaymentVariables) =>
			updateSupplierInvoicePayment(paymentDocumentId, input),
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
