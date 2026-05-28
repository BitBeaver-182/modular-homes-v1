"use client";

import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { Building2Icon } from "lucide-react";

import { InfiniteComboboxFilter } from "@/components/filters/infinite-combobox-filter";

import { getSuppliers } from "../lib/supplier-api";
import type { Supplier } from "../types";

export type SupplierFilterProps = {
	value: Array<string>;
	onApply: (ids: Array<string>) => void;
	label?: string;
	className?: string;
	disabled?: boolean;
};

/**
 * Quotes and other features use this to filter by supplier. Thin wrapper over
 * {@link InfiniteComboboxFilter} that pre-wires the query key, fetcher, id,
 * and label for the `Supplier` entity.
 */
export function SupplierFilter({
	value,
	onApply,
	label,
	className,
	disabled,
}: SupplierFilterProps): JSX.Element {
	const { t } = useTranslation();

	return (
		<InfiniteComboboxFilter<Supplier>
			className={className}
			disabled={disabled}
			getId={(s): string => s.documentId}
			getLabel={(s): string => s.name}
			icon={<Building2Icon className="size-3.5" />}
			label={label ?? t("suppliers.title")}
			noResultsLabel={t("suppliers.noSuppliers")}
			queryKey={["suppliers", "filter"]}
			searchPlaceholder={t("suppliers.searchPlaceholder")}
			value={value}
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
			onApply={onApply}
		/>
	);
}
