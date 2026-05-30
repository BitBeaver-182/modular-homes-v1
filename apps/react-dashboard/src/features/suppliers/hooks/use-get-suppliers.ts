import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { SuppliersQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";

import { supplierKeys } from "./supplier-keys";
import { getSuppliers } from "../lib/supplier-api";

import type {
	SupplierListResponse,
} from "@moduflow/types";

export const useGetSuppliers = (
	organizationId: string,
	params: SuppliersQueryParams
): UseQueryResult<SupplierListResponse, Error> => {
	return useQuery({
		queryKey: supplierKeys.list(organizationId, params),
		queryFn: () => getSuppliers({ organizationId }, params),
		placeholderData: (previousData) => previousData,
	});
};
