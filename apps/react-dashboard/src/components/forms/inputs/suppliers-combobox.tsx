"use client";

import { useTranslation } from "react-i18next";

import {
	InfiniteCombobox,
	type InfiniteComboboxProps,
} from "@/components/forms/inputs/infinite-combobox";
import { getSuppliers } from "@/features/suppliers/lib/supplier-api";
import type { Supplier } from "@/features/suppliers/types";

import type { JSX } from "react";

/**
 * Domain wrapper around {@link InfiniteCombobox} for suppliers. The public
 * API is intentionally unchanged so existing call sites (`quote-form-fields.tsx`
 * etc.) keep working — only the internals moved into the generic primitive.
 */
export type SuppliersComboboxProps<M extends boolean = false> = Omit<
	InfiniteComboboxProps<Supplier, M>,
	"queryKey" | "fetchPage" | "getId" | "getLabel"
>;

export const SuppliersCombobox = <M extends boolean = false>(props: SuppliersComboboxProps<M>): JSX.Element => {
	const { t } = useTranslation();

	return (
		<InfiniteCombobox<Supplier, M>
			getId={(s): string => s.documentId}
			getLabel={(s): string => s.name}
			noResultsLabel={props.noResultsLabel ?? t("suppliers.noSuppliers")}
			queryKey={["suppliers", "combobox"]}
			selectAllLabel={props.selectAllLabel ?? t("suppliers.comboboxSelectAll")}
			fetchPage={async ({ page, pageSize, search }): Promise<{
				data: Array<Supplier>;
				meta: { pagination: { page: number; pageCount: number } };
			}> =>
				getSuppliers({
					page,
					pageSize,
					sortBy: "name",
					sortOrder: "asc",
					search,
				})
			}
			searchPlaceholder={
				props.searchPlaceholder ?? t("suppliers.searchPlaceholder")
			}
			selectedCountLabel={
				props.selectedCountLabel ??
				((count): string => t("suppliers.comboboxSelectedCount", { count }))
			}
			{...props}
		/>
	);
}
