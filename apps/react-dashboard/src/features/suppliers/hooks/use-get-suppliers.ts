import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SuppliersQueryParams } from "@/routes/$locale.o.$organizationSlug._admin._operations.suppliers";
import { getSuppliers } from "../lib/supplier-api";
import type { PaginatedResult, Supplier } from "../types";
import { supplierKeys } from "./supplier-keys";

export const useGetSuppliers = (
	params: SuppliersQueryParams
): UseQueryResult<PaginatedResult<Supplier>, Error> => {
	return useQuery({
		queryKey: supplierKeys.list(params),
		queryFn: () => getSuppliers(params),
		placeholderData: (previousData) => previousData,
	});
};
