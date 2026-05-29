import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import {
	createSupplierInvoicePayment,
	type SupplierInvoicePaymentWriteInput,
} from "../lib/order-api";

export interface CreateInvoicePaymentVariables {
	orderDocumentId: string;
	input: SupplierInvoicePaymentWriteInput;
}

export const useCreateInvoicePayment = (): UseMutationResult<
	void,
	Error,
	CreateInvoicePaymentVariables
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ input }: CreateInvoicePaymentVariables) =>
			createSupplierInvoicePayment(input),
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
