import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { type JSX } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/hooks/use-currency";

import type {
	SupplierOrderDetailInvoiceResponse,
	SupplierOrderInvoiceInstallmentResponse,
	SupplierOrderInvoicePaymentResponse,
} from "@moduflow/types";

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

const INSTALLMENT_STATUS_VARIANT: Record<
	SupplierOrderInvoiceInstallmentResponse["status"],
	"default" | "secondary" | "outline" | "destructive"
> = {
	scheduled: "secondary",
	due: "outline",
	partially_paid: "outline",
	paid: "default",
	overdue: "destructive",
	cancelled: "secondary",
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
	onAddInstallment: (invoice: SupplierOrderDetailInvoiceResponse) => void;
	onAddPayment: (invoice: SupplierOrderDetailInvoiceResponse) => void;
	onDelete: (invoiceId: string) => void;
	onDeleteInstallment: (
		invoice: SupplierOrderDetailInvoiceResponse,
		installment: SupplierOrderInvoiceInstallmentResponse,
	) => void;
	onDeletePayment: (
		invoice: SupplierOrderDetailInvoiceResponse,
		payment: SupplierOrderInvoicePaymentResponse,
	) => void;
	onEdit: (invoice: SupplierOrderDetailInvoiceResponse) => void;
	onEditInstallment: (
		invoice: SupplierOrderDetailInvoiceResponse,
		installment: SupplierOrderInvoiceInstallmentResponse,
	) => void;
	onEditPayment: (
		invoice: SupplierOrderDetailInvoiceResponse,
		payment: SupplierOrderInvoicePaymentResponse,
	) => void;
}

const ActionButtons = ({
	deleteLabel,
	editLabel,
	mutating,
	onDelete,
	onEdit,
}: {
	deleteLabel: string;
	editLabel: string;
	mutating: boolean;
	onDelete: () => void;
	onEdit: () => void;
}): JSX.Element => (
	<div className="flex gap-1">
		<Button
			aria-label={editLabel}
			disabled={mutating}
			size="icon-sm"
			type="button"
			variant="ghost"
			onClick={onEdit}
		>
			<Pencil className="size-4" />
		</Button>
		<Button
			aria-label={deleteLabel}
			disabled={mutating}
			size="icon-sm"
			type="button"
			variant="ghost"
			onClick={onDelete}
		>
			<Trash2 className="size-4" />
		</Button>
	</div>
);

export const InvoiceItemCard = ({
	invoice,
	mutating,
	onAddInstallment,
	onAddPayment,
	onDelete,
	onDeleteInstallment,
	onDeletePayment,
	onEdit,
	onEditInstallment,
	onEditPayment,
}: InvoiceItemCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();
	const paymentProgress =
		invoice.totalAmount.amount > 0
			? (invoice.amountPaid.amount / invoice.totalAmount.amount) * 100
			: 0;

	return (
		<div className="rounded-xl border bg-card p-4 shadow-sm">
			<div className="flex flex-col gap-4">
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

					<div className="flex flex-col gap-3 md:items-end">
						<div className="grid min-w-[240px] grid-cols-3 gap-4 text-right text-sm">
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
						<Progress className="h-2 w-full md:w-[240px]" value={paymentProgress} />
						<div className="flex items-center gap-2">
							{invoice.attachment ? (
								<a
									className="text-sm font-medium text-primary underline-offset-4 hover:underline"
									href={invoice.attachment.url}
									rel="noreferrer"
									target="_blank"
								>
									{invoice.attachment.filename}
								</a>
							) : null}
							<ActionButtons
								deleteLabel={t("orders.invoiceDeleteAction", {
									defaultValue: "Delete invoice",
								})}
								editLabel={t("orders.invoiceEditAction", {
									defaultValue: "Edit invoice",
								})}
								mutating={mutating}
								onDelete={() => {
									onDelete(invoice.id);
								}}
								onEdit={() => {
									onEdit(invoice);
								}}
							/>
						</div>
					</div>
				</div>

				{invoice.notes ? (
					<p className="whitespace-pre-wrap text-sm text-muted-foreground">
						{invoice.notes}
					</p>
				) : null}

				<div className="grid gap-4 lg:grid-cols-2">
					<div className="space-y-3 rounded-lg border bg-muted/20 p-3">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">
								{t("orders.installmentsTitle", {
									defaultValue: "Installments",
								})}
							</p>
							<Button
								disabled={mutating}
								size="sm"
								type="button"
								variant="outline"
								onClick={() => {
									onAddInstallment(invoice);
								}}
							>
								<Plus className="mr-2 size-4" />
								{t("orders.installmentAddAction", {
									defaultValue: "Add installment",
								})}
							</Button>
						</div>

						{invoice.installments.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("orders.noInstallments", {
									defaultValue: "No installments yet",
								})}
							</p>
						) : (
							<div className="space-y-2">
								{invoice.installments.map((installment) => (
									<div
										key={installment.id}
										className="rounded-md border bg-background p-3"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<p className="text-sm font-medium">
														{t("orders.installmentLabel", {
															defaultValue: "Installment {{number}}",
															number: installment.installmentNumber,
														})}
													</p>
													<Badge variant={INSTALLMENT_STATUS_VARIANT[installment.status]}>
														{humanize(installment.status)}
													</Badge>
												</div>
												<p className="text-xs text-muted-foreground">
													{t("orders.detailInvoiceDates", {
														defaultValue: "Issued {{issueDate}} • Due {{dueDate}}",
														issueDate: "—",
														dueDate: formatOptionalDate(installment.dueDate),
													})}
												</p>
												<p className="text-sm">
													{formatAmount(
														installment.amountPaid.amount,
														installment.amountPaid.currencyCode,
													)}{" "}
													/{" "}
													{formatAmount(
														installment.amountDue.amount,
														installment.amountDue.currencyCode,
													)}
												</p>
											</div>
											<ActionButtons
												deleteLabel={t("orders.installmentDeleteAction", {
													defaultValue: "Delete installment",
												})}
												editLabel={t("orders.installmentEditAction", {
													defaultValue: "Edit installment",
												})}
												mutating={mutating}
												onDelete={() => {
													onDeleteInstallment(invoice, installment);
												}}
												onEdit={() => {
													onEditInstallment(invoice, installment);
												}}
											/>
										</div>
										{installment.notes ? (
											<p className="mt-2 text-sm text-muted-foreground">
												{installment.notes}
											</p>
										) : null}
									</div>
								))}
							</div>
						)}
					</div>

					<div className="space-y-3 rounded-lg border bg-muted/20 p-3">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">{t("orders.paymentsTitle")}</p>
							<Button
								disabled={mutating}
								size="sm"
								type="button"
								variant="outline"
								onClick={() => {
									onAddPayment(invoice);
								}}
							>
								<Plus className="mr-2 size-4" />
								{t("orders.paymentAddAction")}
							</Button>
						</div>

						{invoice.payments.length === 0 ? (
							<p className="text-sm text-muted-foreground">{t("orders.noPayments")}</p>
						) : (
							<div className="space-y-2">
								{invoice.payments.map((payment) => (
									<div key={payment.id} className="rounded-md border bg-background p-3">
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<p className="text-sm font-medium">
													{humanize(payment.paymentMethod)}
												</p>
												<p className="text-xs text-muted-foreground">
													{formatOptionalDate(payment.paymentDate)}
												</p>
												<p className="text-sm">
													{formatAmount(payment.amount.amount, payment.amount.currencyCode)}
												</p>
												{payment.invoiceInstallmentId ? (
													<p className="text-xs text-muted-foreground">
														{t("orders.paymentInstallmentAssigned", {
															defaultValue: "Linked to installment {{installmentId}}",
															installmentId: payment.invoiceInstallmentId,
														})}
													</p>
												) : null}
											</div>
											<ActionButtons
												deleteLabel={t("orders.paymentDeleteAction", {
													defaultValue: "Delete payment",
												})}
												editLabel={t("orders.paymentEditAction", {
													defaultValue: "Edit payment",
												})}
												mutating={mutating}
												onDelete={() => {
													onDeletePayment(invoice, payment);
												}}
												onEdit={() => {
													onEditPayment(invoice, payment);
												}}
											/>
										</div>
										{payment.notes ? (
											<p className="mt-2 text-sm text-muted-foreground">
												{payment.notes}
											</p>
										) : null}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
