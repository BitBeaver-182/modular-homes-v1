import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { supplierKeys } from "./supplier-keys";
import { getSupplier } from "../lib/supplier-api";

import type { Supplier } from "../types";

export const useGetSupplier = (
	documentId: string | undefined | null,
): UseQueryResult<Supplier, Error> => {
	return useQuery({
		queryKey: supplierKeys.detail(documentId ?? ""),
		queryFn: () => getSupplier(documentId!),
		enabled: Boolean(documentId),
	});
};
