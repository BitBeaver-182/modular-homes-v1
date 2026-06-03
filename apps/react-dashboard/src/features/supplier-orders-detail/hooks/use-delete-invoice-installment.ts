import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { deleteSupplierOrderInvoiceInstallment } from "../../supplier-orders/lib/order-api";

export interface DeleteInvoiceInstallmentVariables {
	orderId: string;
	invoiceId: string;
	installmentId: string;
}

export const useDeleteInvoiceInstallment = (): UseMutationResult<
	void,
	Error,
	DeleteInvoiceInstallmentVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({
			orderId,
			invoiceId,
			installmentId,
		}: DeleteInvoiceInstallmentVariables) =>
			deleteSupplierOrderInvoiceInstallment(
				{ organizationId },
				orderId,
				invoiceId,
				installmentId,
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
