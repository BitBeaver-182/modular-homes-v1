import { t } from "i18next";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo, type JSX } from "react";

import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Button } from "@/components/ui/button";

import type { Supplier } from "../types";
import type { ColumnDef } from "@tanstack/react-table";

interface UseSuppliersTableProps {
	onEdit?: (supplier: Supplier) => void;
	onDelete?: (supplier: Supplier) => void;
}

interface UseSuppliersTableReturn {
	columns: Array<ColumnDef<Supplier>>;
}

/**
 * Column widths are locked so that sorting / pagination don't reshape the grid.
 * - `actions`      → 64px, header intentionally blank (buttons explain intent)
 * - `email`/`phone`/`website` → equal fixed width (FIXED_SIZE)
 * - `name` / `address`  → `meta.flex`, share whatever the browser has left
 */
const FIXED_SIZE = 200;
const ACTIONS_SIZE = 64;

export const useSuppliersTable = ({
	onEdit,
	onDelete,
}: UseSuppliersTableProps): UseSuppliersTableReturn => {
	const columns = useMemo<Array<ColumnDef<Supplier>>>(
		(): Array<ColumnDef<Supplier>> => [
			{
				accessorKey: "name",
				meta: { flex: true },
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("suppliers.columnName")} />
				),
			},
			{
				accessorKey: "email",
				size: 300,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("suppliers.columnEmail")} />
				),
				cell: ({ row }): string => row.original.email ?? t("suppliers.dash"),
			},
			{
				accessorKey: "phone_number",
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("suppliers.columnPhone")} />
				),
				cell: ({ row }): string =>
					row.original.phone_number ?? t("suppliers.dash"),
			},
			{
				accessorKey: "website",
				enableSorting: false,
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("suppliers.columnWebsite")} />
				),
				cell: ({ row }): JSX.Element | string =>
					row.original.website ? (
						<a
							className="text-primary underline underline-offset-2"
							href={row.original.website}
							rel="noreferrer"
							target="_blank"
						>
							{row.original.website}
						</a>
					) : (
						t("suppliers.dash")
					),
			},
			{
				accessorKey: "address",
				enableSorting: false,
				meta: { flex: true },
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("suppliers.columnAddress")} />
				),
				cell: ({ row }): string => row.original.address ?? t("suppliers.dash"),
			},
			{
				id: "actions",
				enableSorting: false,
				size: ACTIONS_SIZE,
				header: (): null => null,
				cell: ({ row }): JSX.Element => (
					<div className="flex justify-end gap-1">
						{onEdit ? (
							<Button
								size="icon-sm"
								type="button"
								variant="ghost"
								onClick={(): void => {
									onEdit(row.original);
								}}
							>
								<Pencil className="size-4" />
							</Button>
						) : null}
						{onDelete ? (
							<Button
								size="icon-sm"
								type="button"
								variant="ghost"
								onClick={(): void => {
									onDelete(row.original);
								}}
							>
								<Trash2 className="size-4" />
							</Button>
						) : null}
					</div>
				),
			},
		],
		[onEdit, onDelete],
	);

	return useMemo(() => ({ columns }), [columns]);
};
