import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { supplierKeys } from "./supplier-keys";
import { getSupplier } from "../lib/supplier-api";

import type { SupplierResponse } from "@moduflow/types";


export const useGetSupplier = (
	organizationId: string,
	id: string | undefined | null
): UseQueryResult<SupplierResponse, Error> => {
	return useQuery({
		queryKey: supplierKeys.detail(organizationId, id ?? ""),
		queryFn: () => getSupplier({ organizationId }, id!),
		enabled: Boolean(id),
	});
};
