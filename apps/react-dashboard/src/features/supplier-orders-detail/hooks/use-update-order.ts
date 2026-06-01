import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import {
	updateSupplierOrder,
	type UpdateSupplierOrderRequest,
} from "../../supplier-orders/lib/order-api";

import type { SupplierOrderDetailResponse } from "@moduflow/types";

export interface UpdateOrderVariables {
	orderId: string;
	input: UpdateSupplierOrderRequest;
}

export const useUpdateOrder = (): UseMutationResult<
	SupplierOrderDetailResponse,
	Error,
	UpdateOrderVariables
> => {
	const queryClient = useQueryClient();
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useMutation({
		mutationFn: ({ orderId, input }: UpdateOrderVariables) =>
			updateSupplierOrder({ organizationId }, orderId, input),
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
