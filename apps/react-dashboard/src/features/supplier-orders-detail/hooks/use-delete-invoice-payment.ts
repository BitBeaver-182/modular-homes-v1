import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { deleteSupplierOrderInvoicePayment } from "../../supplier-orders/lib/order-api";

export interface DeleteInvoicePaymentVariables {
	orderId: string;
	invoiceId: string;
	paymentId: string;
}

export const useDeleteInvoicePayment = (): UseMutationResult<
	void,
	Error,
	DeleteInvoicePaymentVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({ orderId, invoiceId, paymentId }: DeleteInvoicePaymentVariables) =>
			deleteSupplierOrderInvoicePayment(
				{ organizationId },
				orderId,
				invoiceId,
				paymentId,
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
