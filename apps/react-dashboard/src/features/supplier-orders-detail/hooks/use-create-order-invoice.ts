import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { createSupplierOrderInvoice } from "../../supplier-orders/lib/order-api";

import type {
	CreateSupplierOrderInvoiceRequest,
	SupplierOrderDetailInvoiceResponse,
} from "@moduflow/types";

export interface CreateOrderInvoiceVariables {
	orderId: string;
	input: CreateSupplierOrderInvoiceRequest;
}

export const useCreateOrderInvoice = (): UseMutationResult<
	SupplierOrderDetailInvoiceResponse,
	Error,
	CreateOrderInvoiceVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({ orderId, input }: CreateOrderInvoiceVariables) =>
			createSupplierOrderInvoice({ organizationId }, orderId, input),
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
