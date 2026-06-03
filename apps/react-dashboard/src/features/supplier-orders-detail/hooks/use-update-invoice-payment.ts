import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { updateSupplierOrderInvoicePayment } from "../../supplier-orders/lib/order-api";

import type {
	SupplierOrderInvoicePaymentResponse,
	UpdateSupplierOrderInvoicePaymentRequest,
} from "@moduflow/types";

export interface UpdateInvoicePaymentVariables {
	orderId: string;
	invoiceId: string;
	paymentId: string;
	input: UpdateSupplierOrderInvoicePaymentRequest;
}

export const useUpdateInvoicePayment = (): UseMutationResult<
	SupplierOrderInvoicePaymentResponse,
	Error,
	UpdateInvoicePaymentVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({
			orderId,
			invoiceId,
			paymentId,
			input,
		}: UpdateInvoicePaymentVariables) =>
			updateSupplierOrderInvoicePayment(
				{ organizationId },
				orderId,
				invoiceId,
				paymentId,
				input,
			),
		onSuccess: async (_data, variables): Promise<void> => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
				queryClient.invalidateQueries({
					queryKey: orderKeys.detail(variables.orderId),
				}),
			]);
		},
	});
};
