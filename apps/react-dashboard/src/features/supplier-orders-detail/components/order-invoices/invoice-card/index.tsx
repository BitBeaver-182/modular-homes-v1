import {
	FileText,
	FileTextIcon,
	MoreHorizontalIcon,
	Plus,
	Trash2,
	UserIcon,
} from "lucide-react";
import { useState, type JSX } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utilities";

import { AlertInvoiceDelete } from "./alert-invoice-delete";
import { InvoicePaymentCard } from "./invoice-payment-card";

import type {
	SupplierOrderDetailInvoiceResponse,
	SupplierOrderInvoicePaymentResponse,
} from "@moduflow/types";

interface InvoiceCardProps {
	currency: string;
	mutating: boolean;
	className?: string;
	supplierName: string;
	invoice: SupplierOrderDetailInvoiceResponse;
	onEditInvoice: (invoice: SupplierOrderDetailInvoiceResponse) => void;
	onConfirmDeleteInvoice: (invoice: SupplierOrderDetailInvoiceResponse) => Promise<void>;
	onAddPayment: (invoice: SupplierOrderDetailInvoiceResponse) => void;
	onEditPayment: (
		invoice: SupplierOrderDetailInvoiceResponse,
		payment: SupplierOrderInvoicePaymentResponse,
	) => void;
	onConfirmDeletePayment: (
		payment: SupplierOrderInvoicePaymentResponse,
	) => void | Promise<void>;
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

export const InvoiceCard = ({
	currency,
	mutating,
	supplierName,
	invoice,
	className,
	onEditInvoice,
	onConfirmDeleteInvoice,
	onAddPayment,
	onEditPayment,
	onConfirmDeletePayment,
}: InvoiceCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const invoiceLineCurrency = invoice.totalAmount.currencyCode || currency;
	const invoiceStatusText = (status: SupplierOrderDetailInvoiceResponse["status"]): string =>
		status === "draft"
			? String(t("orders.invoiceStatusDraft"))
			: status === "paid"
				? String(t("orders.invoiceStatusPaid"))
				: status === "overdue"
					? String(t("orders.invoiceStatusOverdue"))
					: status === "cancelled"
						? String(t("orders.invoiceStatusCancelled"))
						: status === "partially_paid"
							? "Partially paid"
							: status === "disputed"
								? "Disputed"
								: status === "void"
									? "Void"
									: "Issued";

	return (
		<Card className={cn("overflow-hidden p-0 gap-0", className)}>
			<CardHeader className="bg-muted dark:bg-muted py-3">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2">
						<div className="bg-blue-50 p-4 row-span-2 size-3 rounded-md grid place-items-center relative">
							<FileText
								className=" text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
								size={20}
							/>
						</div>
						<div>
							<CardTitle className="items-center">
								{invoice.invoiceNumber || supplierName}
								<Badge
									className="ml-3"
									variant={INVOICE_STATUS_VARIANT[invoice.status]}
								>
									{invoiceStatusText(invoice.status)}
								</Badge>
							</CardTitle>
							<CardDescription className="text-xs text-muted-foreground">
								{t("orders.detailInvoiceDates", {
									defaultValue: "Issued {{issueDate}} • Due {{dueDate}}",
									issueDate: invoice.issueDate
										? new Intl.DateTimeFormat(undefined, {
												year: "numeric",
												month: "short",
												day: "2-digit",
											}).format(new Date(invoice.issueDate))
										: "-",
									dueDate: invoice.dueDate
										? new Intl.DateTimeFormat(undefined, {
												year: "numeric",
												month: "short",
												day: "2-digit",
											}).format(new Date(invoice.dueDate))
										: "-",
								})}
							</CardDescription>
						</div>
					</div>

					<div className="flex items-center gap-1">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="icon" variant="ghost">
									<MoreHorizontalIcon aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuGroup>
									<DropdownMenuItem
										onSelect={(event) => {
											event.preventDefault();
											onEditInvoice(invoice);
										}}
									>
										<UserIcon aria-hidden="true" />
										<span>{t("orders.invoiceEditAction")}</span>
									</DropdownMenuItem>
									{invoice.attachment ? (
										<DropdownMenuItem asChild>
											<a
												href={invoice.attachment.url}
												rel="noopener noreferrer"
												target="_blank"
											>
												<FileTextIcon aria-hidden="true" />
												<span>
													{t("orders.invoiceViewAction", {
														defaultValue: "View invoice",
													})}
												</span>
											</a>
										</DropdownMenuItem>
									) : null}
									<DropdownMenuItem
										variant="destructive"
										onSelect={(event) => {
											event.preventDefault();
											setDeleteOpen(true);
										}}
									>
										<Trash2 aria-hidden="true" />
										<span>{t("orders.invoiceDeleteAction")}</span>
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<div className="pt-2 space-y-1">
					<div className="text-muted-foreground flex justify-between text-xs font-medium">
						<span>{t("orders.invoiceTotal")}</span>
						<span>{t("orders.invoiceRemaining")}</span>
					</div>
					<div className="flex justify-between text-lg font-bold">
						<span>
							{formatAmount(invoice.amountPaid.amount, invoiceLineCurrency)} /{" "}
							{formatAmount(invoice.totalAmount.amount, invoiceLineCurrency)}
						</span>
						<span>
							{formatAmount(invoice.balanceDue.amount, invoiceLineCurrency)}
						</span>
					</div>
					<Progress
						className="h-2"
						value={
							invoice.totalAmount.amount > 0
								? (invoice.amountPaid.amount / invoice.totalAmount.amount) * 100
								: 0
						}
					/>
				</div>
			</CardHeader>
			<CardContent className="py-3 border-t bg-white dark:bg-muted">
				<div className="flex justify-between mb-2">
					<p className="text-sm font-medium">{t("orders.paymentsTitle")}</p>
					<Button
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
				<div>
					{(invoice.payments?.length ?? 0) === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("orders.noPayments")}
						</p>
					) : (
						<div className="space-y-2">
							{invoice.payments.map((payment) => (
								<InvoicePaymentCard
									key={payment.id}
									className="bg-muted dark:bg-muted"
									invoice={invoice}
									invoiceLineCurrency={invoiceLineCurrency}
									mutating={mutating}
									payment={payment}
									onConfirmDeletePayment={onConfirmDeletePayment}
									onEditPayment={onEditPayment}
								/>
							))}
						</div>
					)}
				</div>
			</CardContent>
			<AlertInvoiceDelete
				mutating={mutating}
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={() => {
					void onConfirmDeleteInvoice(invoice);
					setDeleteOpen(false);
				}}
			/>
		</Card>
	);
};
