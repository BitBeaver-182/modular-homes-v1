import { Pencil, Trash2 } from "lucide-react";
import { useState, type JSX } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utilities";

import { AlertPaymentDelete } from "./alert-payment-delete";

import type {
	SupplierOrderDetailInvoiceResponse,
	SupplierOrderInvoicePaymentMethod,
	SupplierOrderInvoicePaymentResponse,
} from "@moduflow/types";

interface InvoicePaymentCardProps {
	className?: string;
	invoice: SupplierOrderDetailInvoiceResponse;
	invoiceLineCurrency: string;
	mutating: boolean;
	payment: SupplierOrderInvoicePaymentResponse;
	onEditPayment: (
		invoice: SupplierOrderDetailInvoiceResponse,
		payment: SupplierOrderInvoicePaymentResponse,
	) => void;
	onConfirmDeletePayment: (
		payment: SupplierOrderInvoicePaymentResponse,
	) => void | Promise<void>;
}

export const InvoicePaymentCard = ({
	invoice,
	invoiceLineCurrency,
	mutating,
	payment,
	onEditPayment,
	onConfirmDeletePayment,
	className,
}: InvoicePaymentCardProps): JSX.Element => {
	const { t } = useTranslation();
	const { formatAmount } = useCurrency();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const paymentMethodText = (method: SupplierOrderInvoicePaymentMethod): string =>
		method === "bank_transfer"
			? "Bank transfer"
			: method === "card"
				? String(t("orders.paymentMethodCard"))
				: method === "cash"
					? String(t("orders.paymentMethodCash"))
					: method === "online"
						? "Online"
						: String(t("orders.paymentMethodOther"));

	return (
		<div className={cn("flex items-center rounded-md px-3 py-2 text-sm gap-4", className)}>
			<div className="flex justify-between items-center grow">
				<div>
					<p className="font-medium">{paymentMethodText(payment.paymentMethod)}</p>
					<p className="text-muted-foreground text-xs">
						{payment.paymentDate
							? new Intl.DateTimeFormat(undefined, {
									year: "numeric",
									month: "short",
									day: "2-digit",
								}).format(new Date(payment.paymentDate))
							: "—"}
					</p>
				</div>
				<p className="font-medium">
					{formatAmount(payment.amount.amount, payment.amount.currencyCode || invoiceLineCurrency)}
				</p>
			</div>
			<div className="flex gap-1">
				<Button
					aria-label={t("orders.paymentEditAction", { defaultValue: "Edit payment" })}
					size="icon-sm"
					type="button"
					variant="ghost"
					onClick={() => {
						onEditPayment(invoice, payment);
					}}
				>
					<Pencil className="size-4" />
				</Button>
				<Button
					aria-label={t("orders.paymentDeleteAction", { defaultValue: "Delete payment" })}
					size="icon-sm"
					type="button"
					variant="ghost"
					onClick={() => {
						setDeleteOpen(true);
					}}
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
			<AlertPaymentDelete
				mutating={mutating}
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onConfirm={() => {
					void onConfirmDeletePayment(payment);
					setDeleteOpen(false);
				}}
			/>
		</div>
	);
};
