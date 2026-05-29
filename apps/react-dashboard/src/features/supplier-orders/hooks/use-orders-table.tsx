import { Link, useParams } from "@tanstack/react-router";
import { t } from "i18next";
import { useMemo, type JSX } from "react";

import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { useCurrency } from "@/hooks/use-currency";

import { OrderStatusBadge } from "../components/order-status-badge";

import type { SupplierOrder } from "../types";
import type { ColumnDef } from "@tanstack/react-table";

const FIXED_SIZE = 150;

interface UseOrdersTableReturn {
	columns: Array<ColumnDef<SupplierOrder>>;
}

interface UseOrdersTableProps {
	onOpenOrder?: (order: SupplierOrder) => void;
}

const supplierName = (row: SupplierOrder): string =>
	row.supplier?.name ?? row.quote?.supplier?.name ?? "";

const toOrderCurrency = (order: SupplierOrder): string =>
	order.quote?.total?.currency_code?.toUpperCase() ?? "EUR";

const toOrderNumber = (order: SupplierOrder): string =>
	`SO-${String(order.id).padStart(6, "0")}`;

const sumInvoiceField = (
	order: SupplierOrder,
	field: "total" | "amountPaid"
): number => {
	const invoices = order.invoices ?? [];
	return invoices.reduce((sum, invoice) => {
		const amount = invoice[field]?.amount;
		const parsed =
			typeof amount === "string" ? Number.parseFloat(amount) : amount;
		return (
			sum + (typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0)
		);
	}, 0);
};

export const useOrdersTable = ({
	onOpenOrder,
}: UseOrdersTableProps = {}): UseOrdersTableReturn => {
	const { formatAmount } = useCurrency();
	const params = useParams({ strict: false });
	const locale = typeof params.locale === "string" ? params.locale : "en";
	const organizationSlug =
		typeof params.organizationSlug === "string" ? params.organizationSlug : "";

	const columns = useMemo<Array<ColumnDef<SupplierOrder>>>(
		(): Array<ColumnDef<SupplierOrder>> => [
			{
				id: "id",
				accessorFn: (row): number => row.id,
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader
						column={column}
						title={t("orders.columnOrderNumber")}
					/>
				),
				cell: ({ row }): JSX.Element => (
					<Link
						className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline"
						params={{
							locale,
							organizationSlug,
							orderId: row.original.documentId,
						}}
						to="/$locale/o/$organizationSlug/supplier-orders/$orderId"
						onClick={() => onOpenOrder?.(row.original)}
					>
						{toOrderNumber(row.original)}
					</Link>
				),
			},
			{
				id: "supplier.name",
				accessorFn: supplierName,
				meta: { flex: true },
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader
						column={column}
						title={t("orders.columnSupplier")}
					/>
				),
				cell: ({ row }): string =>
					supplierName(row.original) || t("orders.unknownSupplier"),
			},
			{
				id: "orderStatus",
				accessorFn: (row): string => row.orderStatus,
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader
						column={column}
						title={t("orders.columnStatus")}
					/>
				),
				cell: ({ row }): JSX.Element => (
					<OrderStatusBadge status={row.original.orderStatus} />
				),
			},
			{
				id: "invoices-total",
				accessorFn: (row): number => sumInvoiceField(row, "total"),
				size: FIXED_SIZE,
				enableSorting: false,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader
						column={column}
						title={t("orders.columnOrderTotal")}
					/>
				),
				cell: ({ row }): string => {
					const inv = row.original.invoices;
					if (!inv?.length) {
						return t("orders.notApplicable");
					}
					return formatAmount(
						sumInvoiceField(row.original, "total"),
						toOrderCurrency(row.original)
					);
				},
			},
			{
				id: "invoices-paid",
				accessorFn: (row): number => sumInvoiceField(row, "amountPaid"),
				size: FIXED_SIZE,
				enableSorting: false,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader
						column={column}
						title={t("orders.columnPaid")}
					/>
				),
				cell: ({ row }): string => {
					const inv = row.original.invoices;
					if (!inv?.length) {
						return t("orders.notApplicable");
					}
					return formatAmount(
						sumInvoiceField(row.original, "amountPaid"),
						toOrderCurrency(row.original)
					);
				},
			},
			{
				id: "createdAt",
				accessorFn: (row): string => row.createdAt,
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader
						column={column}
						title={t("orders.columnCreated")}
					/>
				),
				cell: ({ row }): string =>
					new Intl.DateTimeFormat(undefined, {
						year: "numeric",
						month: "short",
						day: "2-digit",
					}).format(new Date(row.original.createdAt)),
			},
		],
		[formatAmount, locale, onOpenOrder, organizationSlug]
	);

	return useMemo(() => ({ columns }), [columns]);
};
