import type {
	SupplierQuoteResponse,
	SupplierQuoteStatus,
} from "@moduflow/types";
import { t } from "i18next";
import { Check, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { useMemo, type JSX } from "react";

import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";

import { QuoteStatusBadge } from "../components/quote-status-badge";
import type { ColumnDef } from "@tanstack/react-table";

const DEFAULT_CURRENCY = "EUR";
const FIXED_SIZE = 140;
const ACTIONS_SIZE = 176;

interface UseQuotesTableProps {
	onEdit?: (quote: SupplierQuoteResponse) => void;
	onDelete?: (quote: SupplierQuoteResponse) => void;
	onRequestStatus?: (
		quote: SupplierQuoteResponse,
		status: Extract<SupplierQuoteStatus, "accepted" | "rejected">,
	) => void;
}

interface UseQuotesTableReturn {
	columns: Array<ColumnDef<SupplierQuoteResponse>>;
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
	onRequestStatus,
}: UseQuotesTableProps): UseQuotesTableReturn => {
	const { formatAmount } = useCurrency();
	const columns = useMemo<Array<ColumnDef<SupplierQuoteResponse>>>(
		(): Array<ColumnDef<SupplierQuoteResponse>> => [
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
				accessorKey: "totalAmount",
				id: "totalAmount",
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnAmount")} />
				),
				cell: ({ row }): string => {
					const amount = row.original.totalAmount ?? 0;
					const currency = row.original.currencyCode;
					return formatAmount(amount, currency ?? DEFAULT_CURRENCY);
				},
			},
			{
				accessorKey: "status",
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnStatus")} />
				),
				cell: ({ row }): JSX.Element => (
					<QuoteStatusBadge status={row.original.status} />
				),
			},
			{
				accessorKey: "quoteDate",
				size: FIXED_SIZE,
				header: ({ column }): JSX.Element => (
					<DataGridColumnHeader column={column} title={t("quotes.columnQuoteDate")} />
				),
				cell: ({ row }): string => {
					const date = row.original.quoteDate ?? row.original.createdAt;
					return new Intl.DateTimeFormat(undefined, {
						year: "numeric",
						month: "short",
						day: "2-digit",
					}).format(new Date(date));
				},
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
					row.original.attachment?.url ? (
						<a
							className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
							href={row.original.attachment.url}
							rel="noreferrer"
							target="_blank"
						>
							{row.original.attachment.filename}
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
					const isReceived = quote.status === "received";

					return (
						<div className="flex justify-end gap-1">
							{isReceived && onRequestStatus ? (
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
		[formatAmount, onEdit, onDelete, onRequestStatus],
	);

	return useMemo(() => ({ columns }), [columns]);
};
