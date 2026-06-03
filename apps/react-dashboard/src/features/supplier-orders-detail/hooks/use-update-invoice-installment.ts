import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { updateSupplierOrderInvoiceInstallment } from "../../supplier-orders/lib/order-api";

import type {
	SupplierOrderInvoiceInstallmentResponse,
	UpdateSupplierOrderInvoiceInstallmentRequest,
} from "@moduflow/types";

export interface UpdateInvoiceInstallmentVariables {
	orderId: string;
	invoiceId: string;
	installmentId: string;
	input: UpdateSupplierOrderInvoiceInstallmentRequest;
}

export const useUpdateInvoiceInstallment = (): UseMutationResult<
	SupplierOrderInvoiceInstallmentResponse,
	Error,
	UpdateInvoiceInstallmentVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({
			orderId,
			invoiceId,
			installmentId,
			input,
		}: UpdateInvoiceInstallmentVariables) =>
			updateSupplierOrderInvoiceInstallment(
				{ organizationId },
				orderId,
				invoiceId,
				installmentId,
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
