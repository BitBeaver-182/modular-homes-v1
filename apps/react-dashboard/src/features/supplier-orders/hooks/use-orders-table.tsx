import { Link, useParams } from "@tanstack/react-router";
import { t } from "i18next";
import { useMemo, type JSX } from "react";

import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { useCurrency } from "@/hooks/use-currency";

import { OrderStatusBadge } from "../components/order-status-badge";

import type { SupplierOrderListItemResponse } from "@moduflow/types";
import type { ColumnDef } from "@tanstack/react-table";

const FIXED_SIZE = 150;

interface UseOrdersTableReturn {
	columns: Array<ColumnDef<SupplierOrderListItemResponse>>;
}

interface UseOrdersTableProps {
	onOpenOrder?: (order: SupplierOrderListItemResponse) => void;
}

const supplierName = (row: SupplierOrderListItemResponse): string =>
	row.supplier?.name ?? row.quote?.supplier?.name ?? "";

const toOrderCurrency = (order: SupplierOrderListItemResponse): string =>
	order.quote?.total?.currencyCode?.toUpperCase() ?? "EUR";

const toOrderNumber = (order: SupplierOrderListItemResponse): string =>
	order.orderNumber ?? order.id;

const sumInvoiceField = (
	order: SupplierOrderListItemResponse,
	field: "total" | "amountPaid"
): number => {
	const invoices = order.invoices ?? [];
	return invoices.reduce((sum, invoice) => {
		const amount = invoice[field]?.amount;
		return sum + (typeof amount === "number" && Number.isFinite(amount) ? amount : 0);
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

	const columns = useMemo<Array<ColumnDef<SupplierOrderListItemResponse>>>(
		(): Array<ColumnDef<SupplierOrderListItemResponse>> => [
			{
				id: "id",
				accessorFn: (row): string => row.id,
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
							orderId: row.original.id,
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
