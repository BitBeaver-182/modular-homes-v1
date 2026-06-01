import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { getSupplierOrderDetail } from "../../supplier-orders/lib/order-api";

import type { SupplierOrderDetailResponse } from "@moduflow/types";

export const useGetOrder = (
	orderId: string | undefined | null,
): UseQueryResult<SupplierOrderDetailResponse, Error> => {
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useQuery({
		queryKey: orderKeys.detail(orderId ?? ""),
		queryFn: () => getSupplierOrderDetail({ organizationId }, orderId!),
		enabled: Boolean(orderId),
	});
};
