import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupplierOrdersSearchParameters } from "@/features/supplier-orders/search-parameters";
import { getSupplierOrders } from "../lib/order-api";
import type { PaginatedResult, SupplierOrder } from "../types";
import { orderKeys } from "./order-keys";

export const useGetOrders = (
	parameters: SupplierOrdersSearchParameters,
): UseQueryResult<PaginatedResult<SupplierOrder>, Error> => {
	return useQuery({
		queryKey: orderKeys.list(parameters),
		queryFn: () => getSupplierOrders(parameters),
		placeholderData: (previousData) => previousData,
	});
};
