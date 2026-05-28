import { useMemo, type JSX } from "react";
import { t } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, ExternalLink, Pencil, ShoppingCart, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";

import { QuoteStatusBadge } from "../components/quote-status-badge";
import type { Quote, QuoteStatus } from "../types";
import { useCurrency } from "@/hooks/use-currency";

const DEFAULT_CURRENCY = "EUR";
const FIXED_SIZE = 140;
const ACTIONS_SIZE = 176;

interface UseQuotesTableProps {
	onEdit?: (quote: Quote) => void;
	onDelete?: (quote: Quote) => void;
	onCreateSupplierOrder?: (quote: Quote) => void;
	onRequestStatus?: (
		quote: Quote,
		status: Extract<QuoteStatus, "accepted" | "rejected">,
	) => void;
}

interface UseQuotesTableReturn {
	columns: Array<ColumnDef<Quote>>;
}

/**
 * Column widths are locked so that sorting / pagination don't reshape the grid.
 * - `supplier.name`, `notes` → `meta.flex`, take whatever space is left
 * - other data columns → fixed width (FIXED_SIZE)
 * - `actions` → wide enough for up to 4 icon buttons (approve/reject/edit/delete)
 */
export const useQuotesTable = ({
	onEdit,
	onDelete,
	onCreateSupplierOrder,
	onRequestStatus,
}: UseQuotesTableProps): UseQuotesTableReturn => {
	const { formatAmount } = useCurrency();
	const columns = useMemo<Array<ColumnDef<Quote>>>(
		(): Array<ColumnDef<Quote>> => [
			{
				id: "supplier.name",
				accessorFn: (row): string => row.supplier?.name ?? "",
				meta: { flex: true },
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnSupplier")} />
				),
				cell: ({ row }): string =>
					row.original.supplier?.name ?? t("quotes.unknownSupplier"),
			},
			{
				accessorKey: "total.amount",
				id: "total.amount",
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnAmount")} />
				),
				cell: ({ row }): string => {
					const amount = row.original.total?.amount ?? 0;
					const currency = row.original.total?.currency_code;
					return formatAmount(amount, currency ?? DEFAULT_CURRENCY);
				},
			},
			{
				accessorKey: "quote_status",
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnStatus")} />
				),
				cell: ({ row }): JSX.Element => (
					<QuoteStatusBadge status={row.original.quote_status} />
				),
			},
			{
				accessorKey: "createdAt",
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnCreated")} />
				),
				cell: ({ row }): string =>
					new Intl.DateTimeFormat(undefined, {
						year: "numeric",
						month: "short",
						day: "2-digit",
					}).format(new Date(row.original.createdAt)),
			},
			{
				accessorKey: "notes",
				enableSorting: false,
				meta: { flex: true },
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnNotes")} />
				),
				cell: ({ row }): string => row.original.notes || t("quotes.dash"),
			},
			{
				id: "pdf",
				enableSorting: false,
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnAttachment")} />
				),
				cell: ({ row }): JSX.Element | string =>
					row.original.pdf?.url ? (
						<a
							className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
							href={row.original.pdf.url}
							rel="noreferrer"
							target="_blank"
						>
							{row.original.pdf.name}
							<ExternalLink className="size-3.5" />
						</a>
					) : (
						t("quotes.emptyAttachment")
					),
			},
			{
				id: "actions",
				enableSorting: false,
				size: ACTIONS_SIZE,
				header: (): null => null,
				cell: ({ row }): JSX.Element => {
					const quote = row.original;
					const isPending = quote.quote_status === "pending";
					const isAccepted = quote.quote_status === "accepted";
					const hasLinkedOrder =
						(quote.supplierOrders?.length ?? 0) > 0 ||
						(quote.orders?.length ?? 0) > 0;

					return (
						<div className="flex justify-end gap-1">
							{isPending && onRequestStatus ? (
								<>
									<Button
										size="icon-sm"
										title={t("quotes.titleAcceptQuote")}
										type="button"
										variant="ghost"
										onClick={(): void => {
											onRequestStatus(quote, "accepted");
										}}
									>
										<Check className="size-4 text-green-600" />
									</Button>
									<Button
										size="icon-sm"
										title={t("quotes.titleRejectQuote")}
										type="button"
										variant="ghost"
										onClick={(): void => {
											onRequestStatus(quote, "rejected");
										}}
									>
										<X className="size-4 text-red-600" />
									</Button>
								</>
							) : null}
							{isAccepted && onCreateSupplierOrder && !hasLinkedOrder ? (
								<Button
									size="icon-sm"
									title={t("quotes.titleCreateSupplierOrder")}
									type="button"
									variant="ghost"
									onClick={(): void => {
										onCreateSupplierOrder(quote);
									}}
								>
									<ShoppingCart className="size-4 text-primary" />
								</Button>
							) : null}
							{onEdit ? (
								<Button
									size="icon-sm"
									title={t("common.edit")}
									type="button"
									variant="ghost"
									onClick={(): void => {
										onEdit(quote);
									}}
								>
									<Pencil className="size-4" />
								</Button>
							) : null}
							{onDelete ? (
								<Button
									size="icon-sm"
									title={t("common.delete")}
									type="button"
									variant="ghost"
									onClick={(): void => {
										onDelete(quote);
									}}
								>
									<Trash2 className="size-4" />
								</Button>
							) : null}
						</div>
					);
				},
			},
		],
		[
			formatAmount,
			onCreateSupplierOrder,
			onEdit,
			onDelete,
			onRequestStatus,
		],
	);

	return useMemo(() => ({ columns }), [columns]);
};
