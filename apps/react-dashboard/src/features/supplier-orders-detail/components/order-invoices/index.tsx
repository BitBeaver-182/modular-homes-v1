import { FileText } from "lucide-react";
import { type JSX, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/hooks/use-currency";

import type { SupplierOrderDetailInvoiceResponse } from "@moduflow/types";

interface OrderInvoicesCardProps {
	invoices: Array<SupplierOrderDetailInvoiceResponse>;
}

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

export const OrderInvoicesCard = ({
	invoices,
}: OrderInvoicesCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();

	const invoicesSorted = useMemo(
		(): Array<SupplierOrderDetailInvoiceResponse> =>
			[...invoices].sort((left, right) => {
				const leftId = BigInt(left.id);
				const rightId = BigInt(right.id);
				if (leftId === rightId) {
					return 0;
				}
				return rightId > leftId ? 1 : -1;
			}),
		[invoices],
	);

	return (
		<Card className="gap-0">
			<CardHeader>
				<CardTitle>{t("orders.invoicesTitle")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{invoicesSorted.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground">{t("orders.noInvoices")}</p>
				) : (
					invoicesSorted.map((invoice) => (
						<div
							key={invoice.id}
							className="rounded-xl border bg-card p-4 shadow-sm"
						>
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
							</div>
							{invoice.notes ? (
								<p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
									{invoice.notes}
								</p>
							) : null}
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
};
