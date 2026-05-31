import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";
import { Route as AdminRoute } from "@/routes/$locale.o.$organizationSlug._admin";

import { orderKeys } from "./order-keys";
import { getSupplierOrders } from "../lib/order-api";

import type { SupplierOrderListResponse } from "@moduflow/types";

export const useGetOrders = (
	parameters: SupplierOrdersSearchParameters,
): UseQueryResult<SupplierOrderListResponse, Error> => {
	const { activeMembership } = AdminRoute.useRouteContext();
	const organizationId = activeMembership.organization.id;

	return useQuery({
		queryKey: orderKeys.list(parameters),
		queryFn: () => getSupplierOrders({ organizationId }, parameters),
		placeholderData: (previousData) => previousData,
	});
};
