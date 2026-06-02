import { FileText, Pencil, Trash2 } from "lucide-react";
import { type JSX } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";

import type { SupplierOrderDetailInvoiceResponse } from "@moduflow/types";

const INVOICE_STATUS_VARIANT: Record<
	SupplierOrderDetailInvoiceResponse["status"],
	"default" | "secondary" | "outline" | "destructive"
> = {
	draft: "secondary",
	issued: "outline",
	partially_paid: "outline",
	paid: "default",
	overdue: "destructive",
	disputed: "destructive",
	cancelled: "secondary",
	void: "secondary",
};

const humanize = (value: string): string =>
	value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const formatOptionalDate = (value: string | null): string =>
	value ? new Date(value).toLocaleDateString() : "—";

interface InvoiceItemCardProps {
	invoice: SupplierOrderDetailInvoiceResponse;
	mutating: boolean;
	onDelete: (invoiceId: string) => void;
	onEdit: (invoice: SupplierOrderDetailInvoiceResponse) => void;
}

export const InvoiceItemCard = ({
	invoice,
	mutating,
	onDelete,
	onEdit,
}: InvoiceItemCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();

	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<FileText className="size-4 text-muted-foreground" />
						<p className="font-semibold">{invoice.invoiceNumber}</p>
						<Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
							{humanize(invoice.status)}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						{humanize(invoice.invoiceType)} • {humanize(invoice.direction)}
					</p>
					<p className="text-sm text-muted-foreground">
						{t("orders.detailInvoiceDates", {
							defaultValue: "Issued {{issueDate}} • Due {{dueDate}}",
							dueDate: formatOptionalDate(invoice.dueDate),
							issueDate: formatOptionalDate(invoice.issueDate),
						})}
					</p>
				</div>
				<div className="flex items-start gap-4">
					<div className="grid min-w-[220px] grid-cols-3 gap-4 text-right text-sm">
						<div>
							<p className="text-muted-foreground">{t("orders.invoiceTotal")}</p>
							<p className="font-medium">
								{formatAmount(invoice.totalAmount.amount, invoice.currencyCode)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">{t("orders.invoicePaid")}</p>
							<p className="font-medium">
								{formatAmount(invoice.amountPaid.amount, invoice.currencyCode)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">{t("orders.invoiceRemaining")}</p>
							<p className="font-medium">
								{formatAmount(invoice.balanceDue.amount, invoice.currencyCode)}
							</p>
						</div>
					</div>
					<div className="flex gap-1">
						<Button
							aria-label={t("orders.invoiceEditAction", {
								defaultValue: "Edit invoice",
							})}
							disabled={mutating}
							size="icon-sm"
							type="button"
							variant="ghost"
							onClick={() => {
								onEdit(invoice);
							}}
						>
							<Pencil className="size-4" />
						</Button>
						<Button
							aria-label={t("orders.invoiceDeleteAction", {
								defaultValue: "Delete invoice",
							})}
							disabled={mutating}
							size="icon-sm"
							type="button"
							variant="ghost"
							onClick={() => {
								onDelete(invoice.id);
							}}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
				</div>
			</div>
			{invoice.notes ? (
				<p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
					{invoice.notes}
				</p>
			) : null}
			{invoice.attachment ? (
				<a
					className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
					href={invoice.attachment.url}
					rel="noreferrer"
					target="_blank"
				>
					{invoice.attachment.filename}
				</a>
			) : null}
		</div>
	);
};
