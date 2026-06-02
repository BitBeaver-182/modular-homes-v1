import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { updateSupplierOrderInvoice } from "../../supplier-orders/lib/order-api";

import type {
	SupplierOrderDetailInvoiceResponse,
	UpdateSupplierOrderInvoiceRequest,
} from "@moduflow/types";

export interface UpdateOrderInvoiceVariables {
	orderId: string;
	invoiceId: string;
	input: UpdateSupplierOrderInvoiceRequest;
}

export const useUpdateOrderInvoice = (): UseMutationResult<
	SupplierOrderDetailInvoiceResponse,
	Error,
	UpdateOrderInvoiceVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({ orderId, invoiceId, input }: UpdateOrderInvoiceVariables) =>
			updateSupplierOrderInvoice({ organizationId }, orderId, invoiceId, input),
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
