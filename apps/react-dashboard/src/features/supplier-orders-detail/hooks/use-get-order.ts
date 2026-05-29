import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { orderKeys } from "../../supplier-orders/hooks/order-keys";
import { getSupplierOrder } from "../lib/order-api";

import type { SupplierOrder } from "../../supplier-orders/types";

export const useGetOrder = (
	documentId: string | undefined | null,
): UseQueryResult<SupplierOrder, Error> => {
	return useQuery({
		queryKey: orderKeys.detail(documentId ?? ""),
		queryFn: () => getSupplierOrder(documentId!),
		enabled: Boolean(documentId),
	});
};
