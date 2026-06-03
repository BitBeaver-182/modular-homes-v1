import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { createSupplierOrderInvoiceInstallment } from "../../supplier-orders/lib/order-api";

import type {
	CreateSupplierOrderInvoiceInstallmentRequest,
	SupplierOrderInvoiceInstallmentResponse,
} from "@moduflow/types";

export interface CreateInvoiceInstallmentVariables {
	orderId: string;
	invoiceId: string;
	input: CreateSupplierOrderInvoiceInstallmentRequest;
}

export const useCreateInvoiceInstallment = (): UseMutationResult<
	SupplierOrderInvoiceInstallmentResponse,
	Error,
	CreateInvoiceInstallmentVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({ orderId, invoiceId, input }: CreateInvoiceInstallmentVariables) =>
			createSupplierOrderInvoiceInstallment({ organizationId }, orderId, invoiceId, input),
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
