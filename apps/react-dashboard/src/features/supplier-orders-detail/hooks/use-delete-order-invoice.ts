import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { deleteSupplierOrderInvoice } from "../../supplier-orders/lib/order-api";

export interface DeleteOrderInvoiceVariables {
	orderId: string;
	invoiceId: string;
}

export const useDeleteOrderInvoice = (): UseMutationResult<
	void,
	Error,
	DeleteOrderInvoiceVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({ orderId, invoiceId }: DeleteOrderInvoiceVariables) =>
			deleteSupplierOrderInvoice({ organizationId }, orderId, invoiceId),
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
