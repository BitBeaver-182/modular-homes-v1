import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getSupplier } from "../lib/supplier-api";
import type { Supplier } from "../types";
import { supplierKeys } from "./supplier-keys";

export const useGetSupplier = (
	documentId: string | undefined | null,
): UseQueryResult<Supplier, Error> => {
	return useQuery({
		queryKey: supplierKeys.detail(documentId ?? ""),
		queryFn: () => getSupplier(documentId as string),
		enabled: Boolean(documentId),
	});
};
